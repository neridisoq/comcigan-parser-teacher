// 교사 시간표 디코딩 방식 정확히 파악하기
const request = require('request');

const TEACHER_HOST = 'http://comci.net:4082';
const SCHOOL_CODE = '41833';
const SC_PREFIX = '73629_';

function analyzeCorrectDecoding() {
  console.log('🔍 교사 시간표 디코딩 방식 정확히 파악하기\n');
  
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
      console.log('📊 교사 시간표와 학급 시간표 교차 분석');
      console.log('='.repeat(60));
      
      const division = data.분리 || 100;
      console.log(`🔢 분리값: ${division}`);
      console.log(`🏫 학급수: 1학년=${data.학급수[1]}개, 2학년=${data.학급수[2]}개, 3학년=${data.학급수[3]}개\n`);
      
      // 학생용 파서의 디코딩 함수들
      function mTh(mm, m2) {
        if (m2 === 100) return Math.floor(mm / m2);
        return mm % m2; 
      }
      
      function mSb(mm, m2) {
        if (m2 === 100) return mm % m2;
        return Math.floor(mm / m2);
      }
      
      // 교사 시간표 분석 - 여러 방법으로 디코딩 시도
      function analyzeTeacherData(rawData) {
        console.log(`\n🔍 원본 데이터 분석: ${rawData}`);
        
        // 방법 1: 단순 학년-반 해석
        const grade1 = Math.floor(rawData / 100);
        const class1 = rawData % 100;
        console.log(`  방법1 (학년-반): ${grade1}-${class1}`);
        
        // 방법 2: 분리값 사용 (학생용과 동일)
        const th = mTh(rawData, division);
        const sb = mSb(rawData, division);
        console.log(`  방법2 (mTh/mSb): th=${th}, sb=${sb}`);
        
        // 방법 3: 다른 분리값 시도
        const th100 = mTh(rawData, 100);
        const sb100 = mSb(rawData, 100);
        console.log(`  방법3 (100분리): th=${th100}, sb=${sb100}`);
        
        // 방법 4: 역순 시도
        const reverse = Math.floor(rawData / 1000);
        const remainder = rawData % 1000;
        console.log(`  방법4 (1000분리): ${reverse}, ${remainder}`);
        
        return {
          grade: grade1,
          class: class1,
          th: th,
          sb: sb
        };
      }
      
      // 교차 검증: 교사 시간표와 학급 시간표 비교
      console.log('🔄 교차 검증: 교사1(김동*)의 월요일 1교시 분석');
      
      const teacherId = 1;
      const teacherMon1 = data.자료542[teacherId][1][1]; // 교사1 월요일 1교시
      console.log(`교사 시간표 데이터: ${teacherMon1}`);
      
      const decoded = analyzeTeacherData(teacherMon1);
      
      // 해당하는 학급을 찾아서 확인
      console.log('\n🔍 해당 학급의 시간표에서 역추적:');
      
      // 모든 학급의 월요일 1교시 확인
      for (let grade = 1; grade <= 3; grade++) {
        if (data.자료147[grade]) {
          for (let classNum = 1; classNum <= data.학급수[grade]; classNum++) {
            if (data.자료147[grade][classNum] && data.자료147[grade][classNum][1] && data.자료147[grade][classNum][1][1]) {
              const classData = data.자료147[grade][classNum][1][1];
              
              // 이 학급의 월요일 1교시에 우리 교사가 있는지 확인
              const classTh = mTh(classData, division);
              const classSb = mSb(classData, division);
              
              if (classTh === teacherId) {
                console.log(`✅ 발견! ${grade}학년 ${classNum}반 월요일 1교시:`);
                console.log(`   학급 시간표 데이터: ${classData}`);
                console.log(`   교사ID: ${classTh}, 과목ID: ${classSb}`);
                console.log(`   교사명: ${data.자료446[classTh] || '?'}`);
                console.log(`   과목명: ${data.자료492[classSb % division] || '?'}`);
                
                // 교사 시간표의 데이터와 비교
                console.log(`   교사 시간표에서는: ${teacherMon1}`);
                
                // 정확한 매칭 확인
                if (teacherMon1 === (grade * 100 + classNum)) {
                  console.log(`   ✅ 매칭됨: 교사 시간표 = 학년*100 + 반번호`);
                } else if (teacherMon1 === classData) {
                  console.log(`   ✅ 매칭됨: 교사 시간표 = 학급 시간표 데이터`);
                } else {
                  console.log(`   ❓ 매칭 방식 확인 필요`);
                }
              }
            }
          }
        }
      }
      
      // 여러 교사의 여러 시간 샘플 분석
      console.log('\n📊 여러 교사 시간표 샘플 분석:');
      
      for (let tId = 1; tId <= 5; tId++) {
        if (data.자료542[tId] && data.자료446[tId]) {
          console.log(`\n👨‍🏫 교사 ${tId} (${data.자료446[tId]}):`);
          
          // 월요일 몇 교시 확인
          for (let period = 1; period <= 3; period++) {
            const timeData = data.자료542[tId][1][period];
            if (timeData && timeData > 0) {
              console.log(`  월요일 ${period}교시: ${timeData}`);
              
              // 해당 학급 찾기
              const simpleGrade = Math.floor(timeData / 100);
              const simpleClass = timeData % 100;
              
              if (simpleGrade >= 1 && simpleGrade <= 3 && simpleClass >= 1 && simpleClass <= data.학급수[simpleGrade]) {
                // 해당 학급의 시간표 확인
                const classTimeData = data.자료147[simpleGrade] && data.자료147[simpleGrade][simpleClass] 
                  && data.자료147[simpleGrade][simpleClass][1] && data.자료147[simpleGrade][simpleClass][1][period];
                
                if (classTimeData) {
                  const classTh = mTh(classTimeData, division);
                  const classSb = mSb(classTimeData, division);
                  
                  if (classTh === tId) {
                    console.log(`    ✅ ${simpleGrade}-${simpleClass}, 과목: ${data.자료492[classSb % division] || '?'}`);
                  } else {
                    console.log(`    ❌ ${simpleGrade}-${simpleClass}, 교사 불일치 (${classTh})`);
                  }
                }
              } else {
                console.log(`    ❓ 잘못된 학급 정보: ${simpleGrade}-${simpleClass}`);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ JSON 파싱 오류:', error.message);
    }
  });
}

// 실행
analyzeCorrectDecoding();