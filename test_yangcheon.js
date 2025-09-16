/**
 * 양천고등학교 시간표 조회 테스트
 */

const Timetable = require('./index');

const testYangcheon = async () => {
  try {
    const timetable = new Timetable();
    
    console.log('1. 초기화 중...');
    await timetable.init();
    
    console.log('2. 양천고등학교 검색 중...');
    const schoolList = await timetable.search('양천고등학교');
    console.log('검색된 학교 목록:');
    console.log(schoolList);
    
    // 양천고등학교 찾기
    const targetSchool = schoolList.find((school) => {
      return school.name.includes('양천고등학교');
    });
    
    if (!targetSchool) {
      console.log('양천고등학교를 찾을 수 없습니다.');
      return;
    }
    
    console.log(`3. 선택된 학교: ${targetSchool.name} (${targetSchool.region})`);
    console.log(`   학교 코드: ${targetSchool.code}`);
    
    console.log('4. 학교 설정 및 시간표 데이터 가져오는 중...');
    timetable.setSchool(targetSchool.code);
    const result = await timetable.getTimetable();
    
    console.log('5. 시간표 구조 확인...');
    console.log('사용 가능한 학년:', Object.keys(result));
    if (result[3]) {
      console.log('3학년 사용 가능한 반:', Object.keys(result[3]));
    }
    
    // 3학년 5반 화요일 6교시 조회
    // 요일: 월(0), 화(1), 수(2), 목(3), 금(4)
    // 교시: 1교시(0), 2교시(1), ..., 6교시(5)
    if (result[3] && result[3][5] && result[3][5][1] && result[3][5][1][5]) {
      const classInfo = result[3][5][1][5];
      console.log('\n=== 양천고등학교 3학년 5반 화요일 6교시 ===');
      console.log(`과목: ${classInfo.subject}`);
      console.log(`선생님: ${classInfo.teacher}`);
      console.log(`학년: ${classInfo.grade}학년`);
      console.log(`반: ${classInfo.class}반`);
      console.log(`요일: ${classInfo.weekdayString}요일`);
      console.log(`교시: ${classInfo.classTime}교시`);
    } else {
      console.log('해당 시간표 정보를 찾을 수 없습니다.');
      console.log('가능한 데이터 구조를 확인해보겠습니다...');
      
      if (result[3] && result[3][5]) {
        console.log('3학년 5반 화요일 시간표:');
        if (result[3][5][1]) {
          result[3][5][1].forEach((period, index) => {
            if (period) {
              console.log(`${index + 1}교시: ${period.subject} (${period.teacher})`);
            }
          });
        } else {
          console.log('화요일 데이터가 없습니다.');
        }
      }
    }
    
  } catch (error) {
    console.error('오류 발생:', error.message);
  }
};

testYangcheon();