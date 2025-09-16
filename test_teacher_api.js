// 교사용 컴시간 API 테스트
const request = require('request');

const TEACHER_HOST = 'http://comci.net:4082';
const SCHOOL_CODE = '41833'; // 양천고등학교
const SC_PREFIX = '73629_';

function testTeacherAPI() {
  console.log('🧪 교사용 컴시간 API 테스트 시작...\n');
  
  // 교사용 사이트에서 사용하는 파라미터 구조
  const da1 = '0';  // 캐시 관련 파라미터
  const r = '1';    // 지역코드 (임시로 1 사용)
  const s7 = SC_PREFIX + SCHOOL_CODE;  // '73629_41833'
  
  // Base64 인코딩: btoa(s7 + '_' + da1 + '_' + r)
  const paramString = s7 + '_' + da1 + '_' + r;
  const encodedParam = Buffer.from(paramString).toString('base64');
  
  const apiUrl = `${TEACHER_HOST}/36179_T?${encodedParam}`;
  
  console.log('📡 API 요청 정보:');
  console.log(`- 학교코드: ${SCHOOL_CODE}`);
  console.log(`- 파라미터 문자열: ${paramString}`);
  console.log(`- Base64 인코딩: ${encodedParam}`);
  console.log(`- 요청 URL: ${apiUrl}\n`);
  
  // API 요청
  request({
    url: apiUrl,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': 'http://comci.net:4082/th'
    }
  }, (error, response, body) => {
    if (error) {
      console.error('❌ 요청 오류:', error.message);
      return;
    }
    
    console.log('📊 응답 정보:');
    console.log(`- 상태코드: ${response.statusCode}`);
    console.log(`- 응답 길이: ${body ? body.length : 0} bytes\n`);
    
    if (body && body.length > 10) {
      try {
        // JSON 파싱 시도
        const jsonEnd = body.lastIndexOf('}') + 1;
        if (jsonEnd > 0) {
          const jsonString = body.substr(0, jsonEnd);
          const data = JSON.parse(jsonString);
          
          console.log('✅ JSON 파싱 성공!');
          console.log('📋 데이터 구조:');
          
          // 주요 데이터 구조 확인
          Object.keys(data).forEach(key => {
            const value = data[key];
            if (Array.isArray(value)) {
              console.log(`  - ${key}: 배열 (길이: ${value.length})`);
            } else if (typeof value === 'object' && value !== null) {
              console.log(`  - ${key}: 객체 (키 개수: ${Object.keys(value).length})`);
            } else {
              console.log(`  - ${key}: ${typeof value} (${value})`);
            }
          });
          
          // 교사 정보 확인
          if (data.자료446) {
            console.log('\n👨‍🏫 교사 정보:');
            console.log(`교사 수: ${data.자료446.length}`);
            if (data.자료446.length > 0) {
              console.log('첫 몇 명의 교사:');
              data.자료446.slice(0, 5).forEach((teacher, index) => {
                console.log(`  ${index + 1}. ${teacher}`);
              });
            }
          }
          
          // 학급 정보 확인
          if (data.학급수) {
            console.log('\n🏫 학급 정보:');
            Object.keys(data.학급수).forEach(grade => {
              console.log(`  ${grade}학년: ${data.학급수[grade]}개 반`);
            });
          }
          
          // 시간표 데이터 구조 확인
          if (data.자료147) {
            console.log('\n📅 시간표 데이터 구조:');
            console.log('자료147 (학급 시간표) 구조 확인됨');
          }
          
          if (data.자료542) {
            console.log('자료542 (교사 시간표) 구조 확인됨');
          }
          
        } else {
          console.log('⚠️  JSON 형식이 아닌 응답:');
          console.log(body.substr(0, 200) + '...');
        }
      } catch (parseError) {
        console.log('❌ JSON 파싱 실패:');
        console.log('원본 응답 (처음 500자):');
        console.log(body.substr(0, 500));
      }
    } else {
      console.log('❌ 응답 데이터가 없거나 너무 짧습니다.');
      if (body) {
        console.log('응답 내용:', body);
      }
    }
  });
}

// 여러 지역코드로 테스트
function testMultipleRegions() {
  console.log('\n🔍 여러 지역코드로 테스트...\n');
  
  const regions = ['1', '2', '3', '4', '5'];
  
  regions.forEach((r, index) => {
    setTimeout(() => {
      console.log(`\n--- 지역코드 ${r} 테스트 ---`);
      
      const da1 = '0';
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
          console.log(`지역코드 ${r}: 요청 오류`);
          return;
        }
        
        console.log(`지역코드 ${r}: 상태코드 ${response.statusCode}, 응답 길이 ${body ? body.length : 0} bytes`);
        
        if (body && body.length > 100) {
          try {
            const jsonEnd = body.lastIndexOf('}') + 1;
            if (jsonEnd > 0) {
              const jsonString = body.substr(0, jsonEnd);
              const data = JSON.parse(jsonString);
              console.log(`지역코드 ${r}: ✅ 성공! 데이터 키 개수: ${Object.keys(data).length}`);
            }
          } catch (e) {
            console.log(`지역코드 ${r}: JSON 파싱 실패`);
          }
        }
      });
    }, index * 1000); // 1초 간격으로 요청
  });
}

// 메인 테스트 실행
testTeacherAPI();

// 3초 후 여러 지역코드 테스트
setTimeout(testMultipleRegions, 3000);