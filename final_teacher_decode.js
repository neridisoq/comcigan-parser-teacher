// 교사 시간표 올바른 디코딩 - 맨 앞 숫자 제거 방식
const request = require('request');

const TEACHER_HOST = 'http://comci.net:4082';
const SCHOOL_CODE = '41833';
const SC_PREFIX = '73629_';

function finalTeacherDecode() {
  console.log('🎯 교사 시간표 최종 올바른 디코딩\n');
  
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
      console.log('📊 교사 시간표 최종 올바른 디코딩');
      console.log('='.repeat(60));
      
      const division = data.분리 || 100;
      
      // 학생용 파서의 디코딩 함수들
      function mTh(mm, m2) {
        if (m2 === 100) return Math.floor(mm / m2);
        return mm % m2; 
      }
      
      function mSb(mm, m2) {
        if (m2 === 100) return mm % m2;
        return Math.floor(mm / m2);
      }
      
      // 교사 시간표 올바른 디코딩 함수
      function decodeTeacherTime(rawData) {
        if (!rawData || rawData <= 0) return null;
        
        // 맨 앞 숫자 제거
        const withoutFirstDigit = rawData % 1000;
        
        // 학년-반 추출
        const grade = Math.floor(withoutFirstDigit / 100);
        const classNum = withoutFirstDigit % 100;
        
        // 유효성 검사
        if (grade >= 1 && grade <= 3 && classNum >= 1 && classNum <= data.학급수[grade]) {
          return {
            grade: grade,
            class: classNum,
            gradeClass: `${grade}학년 ${classNum}반`
          };
        }
        
        return null;
      }
      
      // 해당 학급의 과목 정보 가져오기
      function getSubjectInfo(grade, classNum, day, period) {
        if (data.자료147[grade] && data.자료147[grade][classNum] && 
            data.자료147[grade][classNum][day] && data.자료147[grade][classNum][day][period]) {
          
          const classData = data.자료147[grade][classNum][day][period];
          const teacherId = mTh(classData, division);
          const subjectId = mSb(classData, division);
          
          return {
            subject: data.자료492[subjectId % division] || '?',
            teacherCheck: data.자료446[teacherId] || '?'
          };
        }
        return null;
      }
      
      console.log('📋 디코딩 테스트:');
      
      // 샘플 데이터 테스트
      const samples = [2307, 1210, 3109, 4306, 7308];
      samples.forEach(sample => {
        console.log(`\n원본: ${sample}`);
        const decoded = decodeTeacherTime(sample);
        if (decoded) {
          console.log(`  ✅ ${decoded.gradeClass}`);
        } else {
          console.log(`  ❌ 디코딩 실패`);
        }
      });
      
      // 김동* 선생님의 완전한 시간표
      console.log('\n🎯 김동* 선생님의 완전한 시간표:');
      
      const teacherId = 1;
      const teacherName = data.자료446[teacherId];
      const weekdays = ['', '월', '화', '수', '목', '금'];
      
      console.log(`\n👨‍🏫 ${teacherName} 선생님\n`);
      
      // 헤더 출력
      let header = '교시 |';
      for (let day = 1; day <= 5; day++) {
        header += `     ${weekdays[day]}요일      |`;
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
            const decoded = decodeTeacherTime(rawData);
            if (decoded) {
              const subjectInfo = getSubjectInfo(decoded.grade, decoded.class, day, period);
              const cellContent = `${decoded.grade}-${decoded.class}(${subjectInfo ? subjectInfo.subject : '?'})`;
              row += ` ${cellContent.padEnd(15)} |`;
            } else {
              row += `                 |`;
            }
          } else {
            row += `                 |`;
          }
        }
        console.log(row);
      }
      
      // 여러 교사들의 시간표 요약
      console.log('\n📊 여러 교사들의 시간표 요약:');
      
      for (let tId = 1; tId <= 10; tId++) {
        if (data.자료542[tId] && data.자료446[tId]) {
          const teacherName = data.자료446[tId];
          let totalClasses = 0;
          const gradeClassSet = new Set();
          const subjectSet = new Set();
          
          for (let day = 1; day <= 5; day++) {
            if (data.자료542[tId][day]) {
              for (let period = 1; period <= 8; period++) {
                const rawData = data.자료542[tId][day][period];
                if (rawData && rawData > 0) {
                  const decoded = decodeTeacherTime(rawData);
                  if (decoded) {
                    totalClasses++;
                    gradeClassSet.add(`${decoded.grade}-${decoded.class}`);
                    
                    const subjectInfo = getSubjectInfo(decoded.grade, decoded.class, day, period);
                    if (subjectInfo && subjectInfo.subject !== '?') {
                      subjectSet.add(subjectInfo.subject);
                    }
                  }
                }
              }
            }
          }
          
          if (totalClasses > 0) {
            console.log(`\n${teacherName}:`);
            console.log(`  총 수업: ${totalClasses}시간`);
            console.log(`  담당 학급: ${Array.from(gradeClassSet).join(', ')}`);
            console.log(`  담당 과목: ${Array.from(subjectSet).join(', ')}`);
          }
        }
      }
      
      // 검증: 특정 교시에 대한 양방향 확인
      console.log('\n🔍 검증: 김동* 선생님 월요일 1교시');
      const mon1Data = data.자료542[teacherId][1][1];
      console.log(`교사 시간표 원본: ${mon1Data}`);
      
      const decoded = decodeTeacherTime(mon1Data);
      if (decoded) {
        console.log(`디코딩 결과: ${decoded.gradeClass}`);
        
        const subjectInfo = getSubjectInfo(decoded.grade, decoded.class, 1, 1);
        if (subjectInfo) {
          console.log(`과목: ${subjectInfo.subject}`);
          console.log(`교사 확인: ${subjectInfo.teacherCheck} (${subjectInfo.teacherCheck === teacherName ? '✅' : '❌'})`);
        }
      }
      
    } catch (error) {
      console.error('❌ JSON 파싱 오류:', error.message);
    }
  });
}

// 실행
finalTeacherDecode();