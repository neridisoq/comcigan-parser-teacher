const Timetable = require('./index.js');

async function getYangcheonTimetable() {
  const timetable = new Timetable();
  
  try {
    console.log('1. 컴시간 파서 초기화 중...');
    await timetable.init();
    console.log('✓ 초기화 완료');
    
    console.log('\n2. 양천고등학교 검색 중...');
    const schools = await timetable.search('양천고등학교');
    console.log('검색된 학교들:');
    schools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.name} (${school.region}) - 코드: ${school.code}`);
    });
    
    if (schools.length === 0) {
      console.log('양천고등학교를 찾을 수 없습니다.');
      return;
    }
    
    // 첫 번째 검색 결과 사용
    const yangcheonHigh = schools[0];
    console.log(`\n선택된 학교: ${yangcheonHigh.name} (코드: ${yangcheonHigh.code})`);
    
    console.log('\n3. 학교 설정 중...');
    timetable.setSchool(yangcheonHigh.code);
    console.log('✓ 학교 설정 완료');
    
    console.log('\n4. 시간표 데이터 로딩 중...');
    const timetableData = await timetable.getTimetable();
    console.log('✓ 시간표 데이터 로딩 완료');
    
    // 3학년 5반 수요일 6교시 시간표 추출
    // 수요일은 인덱스 2 (월=0, 화=1, 수=2, 목=3, 금=4)
    // 6교시는 인덱스 5 (1교시=0, 2교시=1, ..., 6교시=5)
    const grade = 3;
    const classNum = 5;
    const wednesday = 2; // 수요일
    const period6 = 5;   // 6교시
    
    console.log('\n5. 3학년 5반 수요일 6교시 시간표:');
    console.log('=====================================');
    
    if (timetableData[grade] && 
        timetableData[grade][classNum] && 
        timetableData[grade][classNum][wednesday] && 
        timetableData[grade][classNum][wednesday][period6]) {
      
      const classInfo = timetableData[grade][classNum][wednesday][period6];
      console.log(`학년: ${classInfo.grade}학년`);
      console.log(`반: ${classInfo.class}반`);
      console.log(`요일: ${classInfo.weekdayString}요일`);
      console.log(`교시: ${classInfo.classTime}교시`);
      console.log(`과목: ${classInfo.subject}`);
      console.log(`선생님: ${classInfo.teacher}`);
      
    } else {
      console.log('해당 시간에 수업이 없거나 데이터를 찾을 수 없습니다.');
      
      // 디버깅을 위해 3학년 5반의 수요일 전체 시간표 출력
      console.log('\n[디버깅] 3학년 5반 수요일 전체 시간표:');
      if (timetableData[grade] && 
          timetableData[grade][classNum] && 
          timetableData[grade][classNum][wednesday]) {
        
        const wednesdaySchedule = timetableData[grade][classNum][wednesday];
        wednesdaySchedule.forEach((period, index) => {
          if (period) {
            console.log(`${index + 1}교시: ${period.subject} (${period.teacher})`);
          } else {
            console.log(`${index + 1}교시: 수업 없음`);
          }
        });
      } else {
        console.log('3학년 5반 수요일 시간표 데이터가 없습니다.');
      }
    }
    
  } catch (error) {
    console.error('오류 발생:', error.message);
  }
}

// 실행
getYangcheonTimetable();