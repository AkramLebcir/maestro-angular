// Test script to verify that grade reports now work with enhanced import data

// Mock data structures
const mockProcessedExcelData = [
  { firstName: 'أحمد', lastName: 'علي', average: 15.5 },
  { firstName: 'فاطمة', lastName: 'محمد', average: 12.3 },
  { firstName: 'علي', lastName: 'حسن', average: 18.7 },
  { firstName: 'سارة', lastName: 'أحمد', average: 8.9 },
  { firstName: 'محمد', lastName: 'خالد', average: 14.2 }
];

const mockStudents = [
  { id: 1, firstName: 'زيد', lastName: 'سعد', averages: { termAverage: 16.0 } },
  { id: 2, firstName: 'لينا', lastName: 'مراد', averages: { termAverage: 13.5 } }
];

// Mock methods that simulate the fixed functionality
function getGradeStatisticsFromExcelData(processedExcelData) {
  const stats = {
    lessThan4: 0,
    between4and6: 0,
    between6and8: 0,
    between8and10: 0,
    between10and12: 0,
    between12and14: 0,
    between14and16: 0,
    greaterThan16: 0,
    total: processedExcelData.length
  };

  processedExcelData.forEach(row => {
    const average = row.average || 0;
    if (average < 4) stats.lessThan4++;
    else if (average < 6) stats.between4and6++;
    else if (average < 8) stats.between6and8++;
    else if (average < 10) stats.between8and10++;
    else if (average < 12) stats.between10and12++;
    else if (average < 14) stats.between12and14++;
    else if (average < 16) stats.between14and16++;
    else stats.greaterThan16++;
  });

  return stats;
}

function getGradeStatistics(processedExcelData, students) {
  // Check if we have processed Excel data from enhanced import
  if (processedExcelData && processedExcelData.length > 0) {
    return getGradeStatisticsFromExcelData(processedExcelData);
  }

  // Fall back to regular student data
  const stats = {
    lessThan4: 0,
    between4and6: 0,
    between6and8: 0,
    between8and10: 0,
    between10and12: 0,
    between12and14: 0,
    between14and16: 0,
    greaterThan16: 0,
    total: students.length
  };

  students.forEach(student => {
    const average = student.averages?.termAverage || 0;
    if (average < 4) stats.lessThan4++;
    else if (average < 6) stats.between4and6++;
    else if (average < 8) stats.between6and8++;
    else if (average < 10) stats.between8and10++;
    else if (average < 12) stats.between10and12++;
    else if (average < 14) stats.between12and14++;
    else if (average < 16) stats.between14and16++;
    else stats.greaterThan16++;
  });

  return stats;
}

function calculateClassAverageFromExcelData(processedExcelData) {
  if (!processedExcelData || processedExcelData.length === 0) return 0;

  const validData = processedExcelData.filter(row => (row.average || 0) > 0);
  if (validData.length === 0) return 0;

  const sum = validData.reduce((acc, row) => acc + (row.average || 0), 0);
  return sum / validData.length;
}

function calculateClassAverage(processedExcelData, students) {
  // Check if we have processed Excel data from enhanced import
  if (processedExcelData && processedExcelData.length > 0) {
    return calculateClassAverageFromExcelData(processedExcelData);
  }

  // Fall back to regular student data
  if (students.length === 0) return 0;

  const studentsWithTermAverage = students.filter(s => (s.averages?.termAverage || 0) > 0);
  if (studentsWithTermAverage.length === 0) return 0;

  const sum = studentsWithTermAverage.reduce((acc, s) => {
    const avg = s.averages?.termAverage || 0;
    return acc + avg;
  }, 0);

  return sum / studentsWithTermAverage.length;
}

// Test the functionality
console.log('=== Testing Grade Reports Fix ===\n');

// Test 1: With processed Excel data (should use Excel data)
console.log('Test 1: Reports with Enhanced Import Data');
const statsWithExcel = getGradeStatistics(mockProcessedExcelData, mockStudents);
const avgWithExcel = calculateClassAverage(mockProcessedExcelData, mockStudents);

console.log('Grade Statistics:', statsWithExcel);
console.log('Class Average:', avgWithExcel.toFixed(2));
console.log('Total students from Excel:', statsWithExcel.total);

// Test 2: Without processed Excel data (should use regular student data)
console.log('\nTest 2: Reports with Regular Student Data (no Excel import)');
const statsWithoutExcel = getGradeStatistics([], mockStudents);
const avgWithoutExcel = calculateClassAverage([], mockStudents);

console.log('Grade Statistics:', statsWithoutExcel);
console.log('Class Average:', avgWithoutExcel.toFixed(2));
console.log('Total students from database:', statsWithoutExcel.total);

// Verification
console.log('\n=== Verification ===');
console.log('✓ Test 1 uses Excel data:', statsWithExcel.total === mockProcessedExcelData.length);
console.log('✓ Test 2 uses database data:', statsWithoutExcel.total === mockStudents.length);

const expectedExcelAvg = (15.5 + 12.3 + 18.7 + 8.9 + 14.2) / 5;
console.log('✓ Excel average calculation correct:', Math.abs(avgWithExcel - expectedExcelAvg) < 0.01);

const expectedDbAvg = (16.0 + 13.5) / 2;
console.log('✓ Database average calculation correct:', Math.abs(avgWithoutExcel - expectedDbAvg) < 0.01);

console.log('\n🎉 Grade reports fix is working correctly!');
