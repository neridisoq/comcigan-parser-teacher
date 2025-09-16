// 교사용 시간표 데이터 올바른 디코딩
const request = require('request');

const TEACHER_HOST = 'http://comci.net:4082';
const SCHOOL_CODE = '41833';
const SC_PREFIX = '73629_';

function analyzeTeacherDataCorrect() {
  console.log('🔍 교사용 시간표 데이터 올바른 디코딩 분석\n');
  
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
    if (error || !body) {
      console.error('❌ 요청 실패');
      return;
    }
    
    try {
      const jsonEnd = body.lastIndexOf('}') + 1;
      const jsonString = body.substr(0, jsonEnd);
      const data = JSON.parse(jsonString);
      
      console.log('='.repeat(60));
      console.log('📊 교사용 시간표 올바른 디코딩 분석');
      console.log('='.repeat(60));
      
      // 분리값 확인 (학생용과 동일한 방식)
      const division = data.분리 || 100;
      console.log(`🔢 분리값 (division): ${division}`);
      
      // 디코딩 함수들 (학생용 파서와 동일)
      function mTh(mm, m2) {
        if (m2 === 100) { 
          return Math.floor(mm / m2); 
        }
        return mm % m2; 
      }
      
      function mSb(mm, m2) {
        if (m2 === 100) { 
          return mm % m2; 
        }
        return Math.floor(mm / m2);
      }
      
      // 교사 시간표 디코딩 함수
      function decodeTeacherTimeData(rawData, division) {
        if (!rawData || rawData <= 0) return null;
        
        // 학생용과 동일한 방식으로 디코딩
        const grade = Math.floor(rawData / 100);
        const classNum = rawData % 100;
        
        return {
          grade: grade,
          class: classNum,
          gradeClass: `${grade}-${classNum}`
        };
      }
      
      // 학급 시간표 디코딩 함수 (참고용)
      function decodeClassTimeData(rawData, division) {
        if (!rawData || rawData <= 0) return null;
        
        const teacherId = mTh(rawData, division);
        const subjectId = mSb(rawData, division);
        
        return {
          teacherId: teacherId,
          subjectId: subjectId % division,
          teacher: data.자료446 && data.자료446[teacherId] ? data.자료446[teacherId] : '',
          subject: data.자료492 && data.자료492[subjectId % division] ? data.자료492[subjectId % division] : ''
        };
      }
      
      console.log('\n📋 디코딩 테스트:');
      
      // 몇 가지 샘플 데이터로 디코딩 테스트
      const sampleData = [2307, 14022, 51049, 23020];
      sampleData.forEach(sample => {
        console.log(`\n원본 데이터: ${sample}`);
        
        // 교사 시간표 방식 (간단한 방식)
        const teacherDecoded = decodeTeacherTimeData(sample, division);
        if (teacherDecoded) {
          console.log(`  교사 시간표 디코딩: ${teacherDecoded.gradeClass}`);
        }
        
        // 학급 시간표 방식 (복잡한 방식)
        const classDecoded = decodeClassTimeData(sample, division);
        if (classDecoded) {
          console.log(`  학급 시간표 디코딩: 교사ID=${classDecoded.teacherId}, 과목ID=${classDecoded.subjectId}`);
          console.log(`    -> 교사: ${classDecoded.teacher}, 과목: ${classDecoded.subject}`);
        }
      });
      
      // 실제 교사의 시간표 올바른 디코딩
      console.log('\n🎯 김동* 선생님의 올바른 시간표:');
      
      const teacherId = 1; // 김동* 선생님
      const weekdays = ['', '월', '화', '수', '목', '금'];
      
      // 헤더 출력
      let header = '교시 |';
      for (let day = 1; day <= 5; day++) {
        header += `    ${weekdays[day]}     |`;
      }
      console.log(header);
      console.log('-'.repeat(header.length));
      
      // 각 교시별 출력
      for (let period = 1; period <= 8; period++) {
        let row = ` ${period}교시 |`;
        for (let day = 1; day <= 5; day++) {
          const rawData = data.자료542[teacherId] && data.자료542[teacherId][day] 
            ? data.자료542[teacherId][day][period] : 0;
          
          if (rawData && rawData > 0) {
            const decoded = decodeTeacherTimeData(rawData, division);
            if (decoded) {
              row += ` ${decoded.gradeClass.padEnd(8)} |`;
            } else {
              row += `          |`;
            }
          } else {
            row += `          |`;
          }
        }
        console.log(row);
      }
      
      // 특정 시간의 상세 정보 확인
      console.log('\n🔍 특정 교시 상세 정보:');
      const monday1st = data.자료542[teacherId][1][1]; // 월요일 1교시
      if (monday1st) {
        console.log(`월요일 1교시 원본 데이터: ${monday1st}`);
        const decoded = decodeTeacherTimeData(monday1st, division);
        console.log(`디코딩 결과: ${decoded ? decoded.gradeClass : '없음'}`);
        
        // 해당 학급의 시간표에서 역추적
        if (decoded) {
          const classTimeData = data.자료147[decoded.grade] 
            && data.자료147[decoded.grade][decoded.class] 
            && data.자료147[decoded.grade][decoded.class][1] 
            && data.자료147[decoded.grade][decoded.class][1][1];
          
          if (classTimeData) {
            console.log(`${decoded.gradeClass} 월요일 1교시 원본: ${classTimeData}`);
            const classDecoded = decodeClassTimeData(classTimeData, division);
            if (classDecoded) {
              console.log(`과목: ${classDecoded.subject}, 교사: ${classDecoded.teacher}`);
            }
          }
        }
      }
      
      // 모든 교사의 수업 통계
      console.log('\n📊 교사별 수업 통계:');
      for (let tId = 1; tId < Math.min(data.자료542.length, 10); tId++) {
        if (data.자료542[tId] && data.자료446[tId]) {
          let classCount = 0;
          const gradeClassSet = new Set();
          
          for (let day = 1; day <= 5; day++) {
            if (data.자료542[tId][day]) {
              for (let period = 1; period <= 8; period++) {
                const rawData = data.자료542[tId][day][period];
                if (rawData && rawData > 0) {
                  classCount++;
                  const decoded = decodeTeacherTimeData(rawData, division);
                  if (decoded) {
                    gradeClassSet.add(decoded.gradeClass);
                  }
                }
              }
            }
          }
          
          if (classCount > 0) {
            console.log(`${data.자료446[tId]}: ${classCount}개 수업, 담당 학급: ${Array.from(gradeClassSet).join(', ')}`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ JSON 파싱 오류:', error.message);
    }
  });
}

// 실행
analyzeTeacherDataCorrect();