// 교사용 시간표 API 서버
const express = require('express');
const request = require('request');
const app = express();
const port = 3000;

const TEACHER_HOST = 'http://comci.net:4082';
const SCHOOL_CODE = '41833'; // 양천고등학교
const SC_PREFIX = '73629_';

// 전역 데이터 캐시
let cachedData = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// 컴시간 데이터 가져오기
async function fetchComciganData() {
  return new Promise((resolve, reject) => {
    // 캐시 확인
    if (cachedData && (Date.now() - lastFetch) < CACHE_DURATION) {
      return resolve(cachedData);
    }
    
    const da1 = '0';
    const r = '1';
    const s7 = SC_PREFIX + SCHOOL_CODE;
    const paramString = s7 + '_' + da1 + '_' + r;
    const encodedParam = Buffer.from(paramString).toString('base64');
    const apiUrl = `${TEACHER_HOST}/36179_T?${encodedParam}`;
    
    request({
      url: apiUrl,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'http://comci.net:4082/th'
      }
    }, (error, response, body) => {
      if (error) {
        return reject(error);
      }
      
      try {
        const jsonEnd = body.lastIndexOf('}') + 1;
        const jsonString = body.substr(0, jsonEnd);
        const data = JSON.parse(jsonString);
        
        cachedData = data;
        lastFetch = Date.now();
        resolve(data);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// 교사 시간표 디코딩 함수
function decodeTeacherTime(rawData) {
  if (!rawData || rawData <= 0) return null;
  
  // 맨 앞 숫자 제거
  const withoutFirstDigit = rawData % 1000;
  
  // 학년-반 추출
  const grade = Math.floor(withoutFirstDigit / 100);
  const classNum = withoutFirstDigit % 100;
  
  return {
    grade: grade,
    class: classNum
  };
}

// 학급 시간표에서 과목 정보 가져오기
function getSubjectInfo(data, grade, classNum, day, period) {
  const division = data.분리 || 100;
  
  function mTh(mm, m2) {
    if (m2 === 100) return Math.floor(mm / m2);
    return mm % m2; 
  }
  
  function mSb(mm, m2) {
    if (m2 === 100) return mm % m2;
    return Math.floor(mm / m2);
  }
  
  if (data.자료147[grade] && data.자료147[grade][classNum] && 
      data.자료147[grade][classNum][day] && data.자료147[grade][classNum][day][period]) {
    
    const classData = data.자료147[grade][classNum][day][period];
    const teacherId = mTh(classData, division);
    const subjectId = mSb(classData, division);
    
    return {
      subject: data.자료492[subjectId % division] || '',
      teacherId: teacherId
    };
  }
  return null;
}

// 교사별 시간표 생성
function generateTeacherTimetable(data, teacherId) {
  const weekdays = ['월', '화', '수', '목', '금'];
  const timetable = [];
  
  // 요일별 (월~금)
  for (let day = 1; day <= 5; day++) {
    const daySchedule = [];
    
    // 교시별 (1~8교시)
    for (let period = 1; period <= 8; period++) {
      let classInfo = {
        grade: 0,
        class: 0,
        weekday: day - 1, // 0부터 시작
        weekdayString: weekdays[day - 1],
        classTime: period,
        teacher: '', // 여기에 학급 번호 (예: "305")
        subject: ''
      };
      
      // 교사 시간표 데이터 확인
      if (data.자료542[teacherId] && data.자료542[teacherId][day] && data.자료542[teacherId][day][period]) {
        const rawData = data.자료542[teacherId][day][period];
        
        if (rawData && rawData > 0) {
          const decoded = decodeTeacherTime(rawData);
          
          if (decoded && decoded.grade >= 1 && decoded.grade <= 3 && 
              decoded.class >= 1 && decoded.class <= data.학급수[decoded.grade]) {
            
            classInfo.grade = decoded.grade;
            classInfo.class = decoded.class;
            classInfo.teacher = `${decoded.grade}${decoded.class.toString().padStart(2, '0')}`; // 예: "305"
            
            // 과목 정보 가져오기
            const subjectInfo = getSubjectInfo(data, decoded.grade, decoded.class, day, period);
            if (subjectInfo) {
              classInfo.subject = subjectInfo.subject;
            }
          }
        }
      }
      
      daySchedule.push(classInfo);
    }
    
    timetable.push(daySchedule);
  }
  
  return timetable;
}

// 교사 목록 엔드포인트
app.get('/teachers', async (req, res) => {
  try {
    const data = await fetchComciganData();
    
    const teachers = [];
    for (let i = 1; i < data.자료446.length; i++) {
      if (data.자료446[i] && data.자료446[i] !== '*') {
        teachers.push({
          id: i,
          name: data.자료446[i]
        });
      }
    }
    
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teacher data' });
  }
});

// 특정 교사의 시간표 엔드포인트
app.get('/:teacherId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    
    if (isNaN(teacherId) || teacherId < 1) {
      return res.status(400).json({ error: 'Invalid teacher ID' });
    }
    
    const data = await fetchComciganData();
    
    // 교사 존재 확인
    if (!data.자료446[teacherId] || data.자료446[teacherId] === '*') {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // 교사 시간표 생성
    const timetable = generateTeacherTimetable(data, teacherId);
    
    res.json(timetable);
    
  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable data' });
  }
});

// 학교 정보 엔드포인트
app.get('/school/info', async (req, res) => {
  try {
    const data = await fetchComciganData();
    
    res.json({
      schoolName: data.학교명,
      region: data.지역명,
      year: data.학년도,
      version: data.버젼,
      lastUpdate: data.자료244,
      totalTeachers: data.교사수,
      gradeClasses: {
        grade1: data.학급수[1],
        grade2: data.학급수[2],
        grade3: data.학급수[3]
      }
    });
  } catch (error) {
    console.error('Error fetching school info:', error);
    res.status(500).json({ error: 'Failed to fetch school info' });
  }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    cached: cachedData ? true : false,
    lastFetch: lastFetch ? new Date(lastFetch).toISOString() : null
  });
});

// 서버 시작
app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 교사용 시간표 API 서버가 http://127.0.0.1:${port} 에서 실행 중입니다!`);
  console.log('');
  console.log('📖 사용 가능한 엔드포인트:');
  console.log(`   GET /teachers        - 교사 목록`);
  console.log(`   GET /{교사번호}       - 특정 교사의 시간표`);
  console.log(`   GET /school/info     - 학교 정보`);
  console.log(`   GET /health          - 서버 상태`);
  console.log('');
  console.log('💡 예시:');
  console.log(`   http://127.0.0.1:${port}/1        - 1번 교사 시간표`);
  console.log(`   http://127.0.0.1:${port}/teachers  - 전체 교사 목록`);
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});