// 교사용 시간표 데이터 구조 상세 분석
const request = require('request');

const TEACHER_HOST = 'http://comci.net:4082';
const SCHOOL_CODE = '41833';
const SC_PREFIX = '73629_';

function analyzeTeacherData() {
  console.log('🔍 교사용 시간표 데이터 구조 상세 분석\n');
  
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
      console.log('📊 양천고등학교 교사용 시간표 데이터 분석');
      console.log('='.repeat(60));
      
      // 기본 정보
      console.log(`🏫 학교명: ${data.학교명}`);
      console.log(`📍 지역: ${data.지역명}`);
      console.log(`📅 학년도: ${data.학년도}`);
      console.log(`🔄 버젼: ${data.버젼}`);
      console.log(`📊 데이터 업데이트: ${data.자료244}\n`);
      
      // 교사 정보 상세 분석
      console.log('👨‍🏫 교사 정보:');
      console.log(`총 교사 수: ${data.교사수}명`);
      console.log(`자료446 배열 길이: ${data.자료446.length}`);
      
      console.log('\n교사 목록 (처음 10명):');
      data.자료446.slice(0, 10).forEach((teacher, index) => {
        console.log(`  ${index}. ${teacher}`);
      });
      
      // 학급 구조 분석
      console.log('\n🏫 학급 구조:');
      for (let grade = 1; grade <= 3; grade++) {
        console.log(`${grade}학년: ${data.학급수[grade]}개 반`);
      }
      
      // 시간표 데이터 구조 분석
      console.log('\n📅 시간표 데이터 구조 분석:');
      
      // 자료147 (학급별 시간표) 구조
      console.log('\n📚 자료147 (학급별 시간표):');
      if (data.자료147) {
        console.log(`차원: ${data.자료147.length}차원`);
        for (let grade = 1; grade <= 3; grade++) {
          if (data.자료147[grade]) {
            console.log(`  ${grade}학년: ${data.자료147[grade].length}개 반`);
            if (data.자료147[grade][1] && data.자료147[grade][1][1]) {
              console.log(`    1반 월요일 1교시 데이터: ${data.자료147[grade][1][1][1] || '없음'}`);
            }
          }
        }
      }
      
      // 자료542 (교사별 시간표) 구조
      console.log('\n👨‍🏫 자료542 (교사별 시간표):');
      if (data.자료542) {
        console.log(`교사 시간표 배열 길이: ${data.자료542.length}`);
        
        // 첫 번째 교사의 시간표 구조 확인
        if (data.자료542[1]) {
          console.log(`  교사 1번 시간표 구조:`);
          if (Array.isArray(data.자료542[1])) {
            console.log(`    요일별 배열 길이: ${data.자료542[1].length}`);
            
            // 월요일 시간표 확인
            if (data.자료542[1][1]) {
              console.log(`    월요일 교시별 배열 길이: ${data.자료542[1][1].length}`);
              console.log(`    월요일 1교시 데이터: ${data.자료542[1][1][1] || '없음'}`);
            }
          }
        }
        
        // 실제 수업이 있는 교사 찾기
        console.log('\n📝 실제 수업이 있는 교사들:');
        for (let teacherId = 1; teacherId < Math.min(data.자료542.length, 10); teacherId++) {
          if (data.자료542[teacherId]) {
            let hasClasses = false;
            let classCount = 0;
            
            // 월~금 요일 확인
            for (let day = 1; day <= 5; day++) {
              if (data.자료542[teacherId][day]) {
                for (let period = 1; period <= 8; period++) {
                  if (data.자료542[teacherId][day][period] && data.자료542[teacherId][day][period] > 0) {
                    hasClasses = true;
                    classCount++;
                  }
                }
              }
            }
            
            if (hasClasses && data.자료446[teacherId]) {
              console.log(`  교사 ${teacherId}: ${data.자료446[teacherId]} (${classCount}개 수업)`);
            }
          }
        }
      }
      
      // 과목 정보 분석
      console.log('\n📖 과목 정보 (자료492):');
      if (data.자료492) {
        console.log(`과목 수: ${data.자료492.length}`);
        console.log('과목 목록 (처음 10개):');
        data.자료492.slice(0, 10).forEach((subject, index) => {
          console.log(`  ${index}. ${subject}`);
        });
      }
      
      // 시간 정보
      console.log('\n⏰ 일과시간:');
      if (data.일과시간) {
        data.일과시간.forEach((time, index) => {
          console.log(`  ${index + 1}교시: ${time}`);
        });
      }
      
      // 특정 교사의 시간표 추출 테스트
      console.log('\n🎯 특정 교사 시간표 추출 테스트:');
      testSpecificTeacher(data);
      
    } catch (error) {
      console.error('❌ JSON 파싱 오류:', error.message);
    }
  });
}

function testSpecificTeacher(data) {
  // 수업이 있는 교사 찾기
  for (let teacherId = 1; teacherId < data.자료542.length; teacherId++) {
    if (data.자료542[teacherId] && data.자료446[teacherId]) {
      let hasClasses = false;
      
      // 수업 확인
      for (let day = 1; day <= 5; day++) {
        if (data.자료542[teacherId][day]) {
          for (let period = 1; period <= 8; period++) {
            if (data.자료542[teacherId][day][period] && data.자료542[teacherId][day][period] > 0) {
              hasClasses = true;
              break;
            }
          }
        }
        if (hasClasses) break;
      }
      
      if (hasClasses) {
        console.log(`\n📋 ${data.자료446[teacherId]} 선생님의 시간표:`);
        
        const weekdays = ['', '월', '화', '수', '목', '금'];
        
        // 헤더 출력
        let header = '교시 |';
        for (let day = 1; day <= 5; day++) {
          header += `  ${weekdays[day]}   |`;
        }
        console.log(header);
        console.log('-'.repeat(header.length));
        
        // 각 교시별 출력
        for (let period = 1; period <= 8; period++) {
          let row = ` ${period}교시 |`;
          for (let day = 1; day <= 5; day++) {
            const classData = data.자료542[teacherId][day] ? data.자료542[teacherId][day][period] : 0;
            if (classData && classData > 0) {
              // 학급 정보 디코딩 (학생용과 유사한 방식)
              const grade = Math.floor(classData / 100);
              const classNum = classData % 100;
              row += ` ${grade}-${classNum} |`;
            } else {
              row += `      |`;
            }
          }
          console.log(row);
        }
        
        // 첫 번째 교사만 출력
        break;
      }
    }
  }
}

// 실행
analyzeTeacherData();