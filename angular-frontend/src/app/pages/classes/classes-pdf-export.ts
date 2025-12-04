// Helper file for PDF export with HTML rendering
export function createPage1(classItem: any, reportData: any, reportDate: string): HTMLElement {
  const page = document.createElement('div');
  page.style.width = '210mm';
  page.style.minHeight = '257mm';
  page.style.padding = '15mm';
  page.style.backgroundColor = '#ffffff';
  page.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  page.style.direction = 'rtl';
  page.style.textAlign = 'right';
  page.style.boxSizing = 'border-box';

  // Header
  const header = document.createElement('div');
  header.style.marginBottom = '15px';
  header.innerHTML = `
    <h1 style="color: #22c55e; font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">
      ${classItem.subject || 'Class'}
    </h1>
    <h2 style="color: #22c55e; font-size: 16px; margin: 0 0 5px 0;">Class Report</h2>
    <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">${reportDate}</p>
    <p style="color: #6b7280; font-size: 14px; margin: 0;">${reportData.class.studentCount} Students</p>
  `;
  page.appendChild(header);

  // Description
  const desc = document.createElement('div');
  desc.style.marginBottom = '15px';
  desc.innerHTML = `
    <p style="font-size: 12px; margin: 0 0 5px 0;">Description</p>
    <p style="color: #9ca3af; font-size: 10px; margin: 0;">Enter description to your class if needed.</p>
  `;
  page.appendChild(desc);

  // Student Roster
  const roster = document.createElement('div');
  const banner = document.createElement('div');
  banner.style.backgroundColor = '#22c55e';
  banner.style.color = '#ffffff';
  banner.style.padding = '8px';
  banner.style.marginBottom = '10px';
  banner.textContent = 'Student Roster';
  roster.appendChild(banner);

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontSize = '10px';

  // Header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Name', 'Grade', 'Name', 'Grade'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.border = '1px solid #000';
    th.style.padding = '5px';
    th.style.textAlign = 'right';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Student rows
  const tbody = document.createElement('tbody');
  const students = reportData.students || [];
  const studentsPerColumn = Math.ceil(students.length / 2);

  for (let i = 0; i < studentsPerColumn; i++) {
    const row = document.createElement('tr');
    
    // Left column
    if (i < students.length) {
      const student = students[i];
      const nameCell = document.createElement('td');
      nameCell.textContent = `${student.lastName} ${student.firstName}`;
      nameCell.style.border = '1px solid #000';
      nameCell.style.padding = '5px';
      nameCell.style.textAlign = 'right';
      row.appendChild(nameCell);

      const gradeCell = document.createElement('td');
      gradeCell.textContent = `${student.averageGrade.toFixed(2)}%`;
      gradeCell.style.border = '1px solid #000';
      gradeCell.style.padding = '5px';
      gradeCell.style.textAlign = 'right';
      row.appendChild(gradeCell);
    } else {
      const empty1 = document.createElement('td');
      empty1.style.border = '1px solid #000';
      empty1.style.padding = '5px';
      row.appendChild(empty1);
      const empty2 = document.createElement('td');
      empty2.style.border = '1px solid #000';
      empty2.style.padding = '5px';
      row.appendChild(empty2);
    }

    // Right column
    if (i + studentsPerColumn < students.length) {
      const student = students[i + studentsPerColumn];
      const nameCell = document.createElement('td');
      nameCell.textContent = `${student.lastName} ${student.firstName}`;
      nameCell.style.border = '1px solid #000';
      nameCell.style.padding = '5px';
      nameCell.style.textAlign = 'right';
      row.appendChild(nameCell);

      const gradeCell = document.createElement('td');
      gradeCell.textContent = `${student.averageGrade.toFixed(2)}%`;
      gradeCell.style.border = '1px solid #000';
      gradeCell.style.padding = '5px';
      gradeCell.style.textAlign = 'right';
      row.appendChild(gradeCell);
    } else {
      const empty1 = document.createElement('td');
      empty1.style.border = '1px solid #000';
      empty1.style.padding = '5px';
      row.appendChild(empty1);
      const empty2 = document.createElement('td');
      empty2.style.border = '1px solid #000';
      empty2.style.padding = '5px';
      row.appendChild(empty2);
    }

    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  roster.appendChild(table);
  page.appendChild(roster);

  // Footer
  const footer = document.createElement('div');
  footer.style.position = 'absolute';
  footer.style.bottom = '15mm';
  footer.style.width = '100%';
  footer.style.fontSize = '10px';
  footer.style.color = '#9ca3af';
  footer.textContent = 'Page 1 of 4';
  page.appendChild(footer);

  return page;
}

export function createPage2(classItem: any, reportData: any, reportDate: string): HTMLElement {
  const page = document.createElement('div');
  page.style.width = '210mm';
  page.style.minHeight = '257mm';
  page.style.padding = '15mm';
  page.style.backgroundColor = '#ffffff';
  page.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  page.style.direction = 'rtl';
  page.style.textAlign = 'right';
  page.style.boxSizing = 'border-box';

  // Header (same as page 1)
  const header = document.createElement('div');
  header.style.marginBottom = '15px';
  header.innerHTML = `
    <h1 style="color: #22c55e; font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">
      ${classItem.subject || 'Class'}
    </h1>
    <h2 style="color: #22c55e; font-size: 16px; margin: 0 0 5px 0;">Class Report</h2>
    <p style="color: #6b7280; font-size: 12px; margin: 0;">${reportDate}</p>
  `;
  page.appendChild(header);

  // Attendance Banner
  const banner = document.createElement('div');
  banner.style.backgroundColor = '#22c55e';
  banner.style.color = '#ffffff';
  banner.style.padding = '8px';
  banner.style.marginBottom = '15px';
  banner.textContent = 'Attendance';
  page.appendChild(banner);

  // Overall Attendance
  const overallTitle = document.createElement('h3');
  overallTitle.textContent = 'Overall Attendance';
  overallTitle.style.fontSize = '14px';
  overallTitle.style.marginBottom = '10px';
  page.appendChild(overallTitle);

  const attendance = reportData.attendance?.overall || {};
  const stats = [
    { key: 'present', label: 'Present', value: attendance.present || 0, color: '#22c55e' },
    { key: 'absent', label: 'Absent', value: attendance.absent || 0, color: '#ef4444' },
    { key: 'late', label: 'Late', value: attendance.late || 0, color: '#eab308' },
    { key: 'sick', label: 'Sick', value: attendance.sick || 0, color: '#f97316' },
    { key: 'excused', label: 'Excused', value: attendance.excused || 0, color: '#3b82f6' },
  ];

  const totalAttendance = stats.reduce((sum, s) => sum + (s.value || 0), 0);

  // Donut Chart for Overall Attendance
  if (totalAttendance > 0) {
    const chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.marginBottom = '20px';
    chartContainer.style.alignItems = 'center';
    chartContainer.style.gap = '20px';

    // SVG Donut Chart
    const svgSize = 150;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const radius = 60;
    const innerRadius = 40;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgSize.toString());
    svg.setAttribute('height', svgSize.toString());
    svg.style.display = 'block';

    let currentAngle = -90; // Start from top
    stats.forEach((stat) => {
      if (stat.value === 0) return;
      const percentage = (stat.value / totalAttendance) * 100;
      const angle = (percentage / 100) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArc = angle > 180 ? 1 : 0;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      path.setAttribute('d', d);
      path.setAttribute('fill', stat.color);
      path.setAttribute('stroke', '#ffffff');
      path.setAttribute('stroke-width', '2');

      // Inner circle cutout
      const innerX1 = centerX + innerRadius * Math.cos((startAngle * Math.PI) / 180);
      const innerY1 = centerY + innerRadius * Math.sin((startAngle * Math.PI) / 180);
      const innerX2 = centerX + innerRadius * Math.cos((endAngle * Math.PI) / 180);
      const innerY2 = centerY + innerRadius * Math.sin((endAngle * Math.PI) / 180);
      const innerD = `M ${centerX} ${centerY} L ${innerX2} ${innerY2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX1} ${innerY1} Z`;
      const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      innerPath.setAttribute('d', innerD);
      innerPath.setAttribute('fill', '#ffffff');
      path.setAttribute('clip-path', 'url(#clip)');

      svg.appendChild(path);
      currentAngle = endAngle;
    });

    // Add clip path for donut effect
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'donut-clip');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', centerX.toString());
    circle.setAttribute('cy', centerY.toString());
    circle.setAttribute('r', radius.toString());
    clipPath.appendChild(circle);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    // Inner white circle
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', centerX.toString());
    innerCircle.setAttribute('cy', centerY.toString());
    innerCircle.setAttribute('r', innerRadius.toString());
    innerCircle.setAttribute('fill', '#ffffff');
    svg.appendChild(innerCircle);

    chartContainer.appendChild(svg);

    // Legend
    const legend = document.createElement('div');
    legend.style.flex = '1';
    stats.forEach((stat) => {
      const legendItem = document.createElement('div');
      legendItem.style.marginBottom = '6px';
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.fontSize = '10px';

      const colorBox = document.createElement('span');
      colorBox.style.display = 'inline-block';
      colorBox.style.width = '12px';
      colorBox.style.height = '12px';
      colorBox.style.backgroundColor = stat.color;
      colorBox.style.marginLeft = '8px';
      colorBox.style.border = '1px solid #ccc';

      const labelSpan = document.createElement('span');
      labelSpan.textContent = `${stat.label}: ${stat.value}`;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelSpan);
      legend.appendChild(legendItem);
    });
    chartContainer.appendChild(legend);
    page.appendChild(chartContainer);
  }

  // Weekly Distribution
  const weeklyTitle = document.createElement('h3');
  weeklyTitle.textContent = 'Weekly Distribution (Last 16 weeks)';
  weeklyTitle.style.fontSize = '12px';
  weeklyTitle.style.marginTop = '20px';
  weeklyTitle.style.marginBottom = '10px';
  page.appendChild(weeklyTitle);

  // Stacked Bar Chart for Weekly Distribution
  const weeklyData = reportData.attendance?.weekly || [];
  if (weeklyData.length > 0) {
    const chartContainer = document.createElement('div');
    chartContainer.style.marginBottom = '20px';
    chartContainer.style.height = '200px';

    // Legend
    const legend = document.createElement('div');
    legend.style.marginBottom = '8px';
    legend.style.display = 'flex';
    legend.style.gap = '10px';
    legend.style.flexWrap = 'wrap';
    legend.style.fontSize = '8px';
    stats.forEach((stat) => {
      const legendItem = document.createElement('div');
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      const colorBox = document.createElement('span');
      colorBox.style.width = '10px';
      colorBox.style.height = '10px';
      colorBox.style.backgroundColor = stat.color;
      colorBox.style.marginLeft = '4px';
      colorBox.style.border = '1px solid #ccc';
      const label = document.createElement('span');
      label.textContent = stat.label;
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      legend.appendChild(legendItem);
    });
    chartContainer.appendChild(legend);

    // Chart area
    const chartArea = document.createElement('div');
    chartArea.style.position = 'relative';
    chartArea.style.height = '150px';
    chartArea.style.borderLeft = '2px solid #000';
    chartArea.style.borderBottom = '2px solid #000';
    chartArea.style.paddingTop = '10px';

    // Y-axis labels
    const maxValue = Math.max(...weeklyData.map((w: any) => 
      (w.present || 0) + (w.absent || 0) + (w.late || 0) + (w.sick || 0) + (w.excused || 0)
    ));
    const yAxisLabels = document.createElement('div');
    yAxisLabels.style.position = 'absolute';
    yAxisLabels.style.left = '-30px';
    yAxisLabels.style.top = '0';
    yAxisLabels.style.height = '100%';
    yAxisLabels.style.display = 'flex';
    yAxisLabels.style.flexDirection = 'column';
    yAxisLabels.style.justifyContent = 'space-between';
    yAxisLabels.style.fontSize = '8px';
    for (let i = 0; i <= 5; i++) {
      const label = document.createElement('div');
      label.textContent = Math.round((maxValue * i) / 5).toString();
      yAxisLabels.appendChild(label);
    }
    chartArea.appendChild(yAxisLabels);

    // Bars container
    const barsContainer = document.createElement('div');
    barsContainer.style.display = 'flex';
    barsContainer.style.gap = '8px';
    barsContainer.style.height = '100%';
    barsContainer.style.alignItems = 'flex-end';
    barsContainer.style.paddingLeft = '10px';
    barsContainer.style.paddingRight = '10px';

    weeklyData.slice(0, 8).forEach((week: any) => {
      const weekTotal = (week.present || 0) + (week.absent || 0) + (week.late || 0) + (week.sick || 0) + (week.excused || 0);
      if (weekTotal === 0) return;

      const barWrapper = document.createElement('div');
      barWrapper.style.flex = '1';
      barWrapper.style.height = '100%';
      barWrapper.style.display = 'flex';
      barWrapper.style.flexDirection = 'column';
      barWrapper.style.justifyContent = 'flex-end';
      barWrapper.style.position = 'relative';

      const bar = document.createElement('div');
      bar.style.width = '100%';
      bar.style.display = 'flex';
      bar.style.flexDirection = 'column';
      bar.style.height = `${(weekTotal / maxValue) * 100}%`;
      bar.style.minHeight = '4px';

      stats.forEach((stat) => {
        const value = week[stat.key] || 0;
        if (value > 0) {
          const segment = document.createElement('div');
          segment.style.height = `${(value / weekTotal) * 100}%`;
          segment.style.backgroundColor = stat.color;
          segment.style.borderTop = '1px solid #fff';
          bar.appendChild(segment);
        }
      });

      // Week label
      const weekLabel = document.createElement('div');
      weekLabel.style.fontSize = '7px';
      weekLabel.style.textAlign = 'center';
      weekLabel.style.marginTop = '2px';
      weekLabel.style.transform = 'rotate(-45deg)';
      weekLabel.style.transformOrigin = 'center';
      const weekDate = week.weekStart ? new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      weekLabel.textContent = weekDate;
      barWrapper.appendChild(bar);
      barWrapper.appendChild(weekLabel);
      barsContainer.appendChild(barWrapper);
    });

    chartArea.appendChild(barsContainer);
    chartContainer.appendChild(chartArea);
    page.appendChild(chartContainer);
  }

  // Top 5 Table
  const top5Title = document.createElement('h3');
  top5Title.textContent = 'Top 5';
  top5Title.style.fontSize = '12px';
  top5Title.style.marginTop = '20px';
  top5Title.style.marginBottom = '10px';
  page.appendChild(top5Title);

  const top5Data = reportData.attendance?.top5 || {};
  const top5Table = document.createElement('table');
  top5Table.style.width = '100%';
  top5Table.style.borderCollapse = 'collapse';
  top5Table.style.fontSize = '8px';

  const statuses = [
    { key: 'excused', label: 'Excused', color: '#3b82f6' },
    { key: 'late', label: 'Late', color: '#eab308' },
    { key: 'sick', label: 'Sick', color: '#f97316' },
    { key: 'present', label: 'Present', color: '#22c55e' },
  ];

  const headerRow = document.createElement('tr');
  statuses.forEach((status) => {
    const th = document.createElement('th');
    th.textContent = status.label;
    th.style.backgroundColor = status.color;
    th.style.color = '#ffffff';
    th.style.border = '1px solid #000';
    th.style.padding = '4px';
    th.style.textAlign = 'right';
    headerRow.appendChild(th);
  });
  top5Table.appendChild(headerRow);

  for (let i = 0; i < 5; i++) {
    const row = document.createElement('tr');
    statuses.forEach((status) => {
      const td = document.createElement('td');
      const data = top5Data[status.key] || [];
      if (data[i]) {
        const nameDiv = document.createElement('div');
        nameDiv.textContent = data[i].name || '';
        nameDiv.style.textAlign = 'right';
        nameDiv.style.marginBottom = '2px';
        nameDiv.style.fontSize = '8px';
        
        const countDiv = document.createElement('div');
        countDiv.textContent = `${data[i].count || 0}`;
        countDiv.style.textAlign = 'left';
        countDiv.style.fontSize = '8px';
        countDiv.style.fontWeight = 'bold';
        
        td.appendChild(nameDiv);
        td.appendChild(countDiv);
      }
      td.style.border = '1px solid #000';
      td.style.padding = '4px';
      td.style.minHeight = '20px';
      row.appendChild(td);
    });
    top5Table.appendChild(row);
  }
  page.appendChild(top5Table);

  // Footer
  const footer = document.createElement('div');
  footer.style.position = 'absolute';
  footer.style.bottom = '15mm';
  footer.style.width = '100%';
  footer.style.fontSize = '10px';
  footer.style.color = '#9ca3af';
  footer.textContent = 'Page 2 of 4';
  page.appendChild(footer);

  return page;
}

export function createPage3(classItem: any, reportData: any, reportDate: string): HTMLElement {
  const page = document.createElement('div');
  page.style.width = '210mm';
  page.style.minHeight = '257mm';
  page.style.padding = '15mm';
  page.style.backgroundColor = '#ffffff';
  page.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  page.style.direction = 'rtl';
  page.style.textAlign = 'right';
  page.style.boxSizing = 'border-box';

  // Header
  const header = document.createElement('div');
  header.style.marginBottom = '15px';
  header.innerHTML = `
    <h1 style="color: #22c55e; font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">
      ${classItem.subject || 'Class'}
    </h1>
    <h2 style="color: #22c55e; font-size: 16px; margin: 0 0 5px 0;">Class Report</h2>
    <p style="color: #6b7280; font-size: 12px; margin: 0;">${reportDate}</p>
  `;
  page.appendChild(header);

  // Behavior Banner
  const banner = document.createElement('div');
  banner.style.backgroundColor = '#22c55e';
  banner.style.color = '#ffffff';
  banner.style.padding = '8px';
  banner.style.marginBottom = '15px';
  banner.textContent = 'Behavior';
  page.appendChild(banner);

  // Overall Behavior
  const overallTitle = document.createElement('h3');
  overallTitle.textContent = 'Overall Behavior';
  overallTitle.style.fontSize = '14px';
  overallTitle.style.marginBottom = '15px';
  page.appendChild(overallTitle);

  const behavior = reportData.behavior?.overall || {};
  const buttonsDiv = document.createElement('div');
  buttonsDiv.style.display = 'flex';
  buttonsDiv.style.gap = '20px';
  buttonsDiv.style.marginBottom = '20px';
  buttonsDiv.style.justifyContent = 'center';

  const positiveBtn = document.createElement('div');
  positiveBtn.style.width = '80px';
  positiveBtn.style.height = '40px';
  positiveBtn.style.backgroundColor = '#22c55e';
  positiveBtn.style.color = '#ffffff';
  positiveBtn.style.display = 'flex';
  positiveBtn.style.flexDirection = 'column';
  positiveBtn.style.alignItems = 'center';
  positiveBtn.style.justifyContent = 'center';
  positiveBtn.style.fontSize = '20px';
  positiveBtn.style.fontWeight = 'bold';
  positiveBtn.style.borderRadius = '4px';
  const positiveIcon = document.createElement('div');
  positiveIcon.textContent = '✓';
  positiveIcon.style.fontSize = '18px';
  const positiveCount = document.createElement('div');
  positiveCount.textContent = `${behavior.positive || 0}`;
  positiveCount.style.fontSize = '16px';
  positiveBtn.appendChild(positiveIcon);
  positiveBtn.appendChild(positiveCount);
  buttonsDiv.appendChild(positiveBtn);

  const negativeBtn = document.createElement('div');
  negativeBtn.style.width = '80px';
  negativeBtn.style.height = '40px';
  negativeBtn.style.backgroundColor = '#ef4444';
  negativeBtn.style.color = '#ffffff';
  negativeBtn.style.display = 'flex';
  negativeBtn.style.flexDirection = 'column';
  negativeBtn.style.alignItems = 'center';
  negativeBtn.style.justifyContent = 'center';
  negativeBtn.style.fontSize = '20px';
  negativeBtn.style.fontWeight = 'bold';
  negativeBtn.style.borderRadius = '4px';
  const negativeIcon = document.createElement('div');
  negativeIcon.textContent = '✗';
  negativeIcon.style.fontSize = '18px';
  const negativeCount = document.createElement('div');
  negativeCount.textContent = `${behavior.negative || 0}`;
  negativeCount.style.fontSize = '16px';
  negativeBtn.appendChild(negativeIcon);
  negativeBtn.appendChild(negativeCount);
  buttonsDiv.appendChild(negativeBtn);

  page.appendChild(buttonsDiv);

  // Weekly Distribution Line Chart
  const weeklyTitle = document.createElement('h3');
  weeklyTitle.textContent = 'Weekly Distribution (Last 16 weeks)';
  weeklyTitle.style.fontSize = '12px';
  weeklyTitle.style.marginTop = '20px';
  weeklyTitle.style.marginBottom = '10px';
  page.appendChild(weeklyTitle);

  const weeklyData = reportData.behavior?.weekly || [];
  if (weeklyData.length > 0) {
    const chartContainer = document.createElement('div');
    chartContainer.style.marginBottom = '20px';
    chartContainer.style.height = '180px';
    chartContainer.style.position = 'relative';

    // Legend
    const legend = document.createElement('div');
    legend.style.marginBottom = '8px';
    legend.style.display = 'flex';
    legend.style.gap = '15px';
    legend.style.fontSize = '9px';
    
    const positiveLegend = document.createElement('div');
    positiveLegend.style.display = 'flex';
    positiveLegend.style.alignItems = 'center';
    const posLine = document.createElement('span');
    posLine.style.width = '20px';
    posLine.style.height = '2px';
    posLine.style.backgroundColor = '#22c55e';
    posLine.style.marginLeft = '5px';
    posLine.style.display = 'inline-block';
    const posLabel = document.createElement('span');
    posLabel.textContent = 'Positive';
    positiveLegend.appendChild(posLine);
    positiveLegend.appendChild(posLabel);

    const negativeLegend = document.createElement('div');
    negativeLegend.style.display = 'flex';
    negativeLegend.style.alignItems = 'center';
    const negLine = document.createElement('span');
    negLine.style.width = '20px';
    negLine.style.height = '2px';
    negLine.style.backgroundColor = '#ef4444';
    negLine.style.marginLeft = '5px';
    negLine.style.display = 'inline-block';
    const negLabel = document.createElement('span');
    negLabel.textContent = 'Negative';
    negativeLegend.appendChild(negLine);
    negativeLegend.appendChild(negLabel);

    legend.appendChild(positiveLegend);
    legend.appendChild(negativeLegend);
    chartContainer.appendChild(legend);

    // Chart area
    const chartArea = document.createElement('div');
    chartArea.style.position = 'relative';
    chartArea.style.height = '140px';
    chartArea.style.borderLeft = '2px solid #000';
    chartArea.style.borderBottom = '2px solid #000';
    chartArea.style.paddingTop = '5px';
    chartArea.style.paddingRight = '10px';

    // Y-axis labels
    const maxValue = Math.max(
      ...weeklyData.map((w: any) => Math.max(w.positive || 0, w.negative || 0)),
      1
    );
    const yAxisLabels = document.createElement('div');
    yAxisLabels.style.position = 'absolute';
    yAxisLabels.style.left = '-25px';
    yAxisLabels.style.top = '0';
    yAxisLabels.style.height = '100%';
    yAxisLabels.style.display = 'flex';
    yAxisLabels.style.flexDirection = 'column';
    yAxisLabels.style.justifyContent = 'space-between';
    yAxisLabels.style.fontSize = '8px';
    for (let i = 0; i <= 5; i++) {
      const label = document.createElement('div');
      label.textContent = Math.round((maxValue * i) / 5).toString();
      yAxisLabels.appendChild(label);
    }
    chartArea.appendChild(yAxisLabels);

    // SVG for line chart
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';

    const chartWidth = 500; // Approximate width
    const chartHeight = 130;
    const padding = 20;
    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;
    const pointCount = Math.min(weeklyData.length, 8);

    // Positive line
    const positivePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let posPathData = '';
    weeklyData.slice(0, pointCount).forEach((week: any, index: number) => {
      const x = padding + (index / (pointCount - 1 || 1)) * plotWidth;
      const y = padding + plotHeight - ((week.positive || 0) / maxValue) * plotHeight;
      if (index === 0) {
        posPathData += `M ${x} ${y}`;
      } else {
        posPathData += ` L ${x} ${y}`;
      }
    });
    positivePath.setAttribute('d', posPathData);
    positivePath.setAttribute('stroke', '#22c55e');
    positivePath.setAttribute('stroke-width', '2');
    positivePath.setAttribute('fill', 'none');
    svg.appendChild(positivePath);

    // Negative line
    const negativePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let negPathData = '';
    weeklyData.slice(0, pointCount).forEach((week: any, index: number) => {
      const x = padding + (index / (pointCount - 1 || 1)) * plotWidth;
      const y = padding + plotHeight - ((week.negative || 0) / maxValue) * plotHeight;
      if (index === 0) {
        negPathData += `M ${x} ${y}`;
      } else {
        negPathData += ` L ${x} ${y}`;
      }
    });
    negativePath.setAttribute('d', negPathData);
    negativePath.setAttribute('stroke', '#ef4444');
    negativePath.setAttribute('stroke-width', '2');
    negativePath.setAttribute('fill', 'none');
    svg.appendChild(negativePath);

    // Points
    weeklyData.slice(0, pointCount).forEach((week: any, index: number) => {
      const x = padding + (index / (pointCount - 1 || 1)) * plotWidth;
      const posY = padding + plotHeight - ((week.positive || 0) / maxValue) * plotHeight;
      const negY = padding + plotHeight - ((week.negative || 0) / maxValue) * plotHeight;

      const posCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      posCircle.setAttribute('cx', x.toString());
      posCircle.setAttribute('cy', posY.toString());
      posCircle.setAttribute('r', '3');
      posCircle.setAttribute('fill', '#22c55e');
      svg.appendChild(posCircle);

      const negCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      negCircle.setAttribute('cx', x.toString());
      negCircle.setAttribute('cy', negY.toString());
      negCircle.setAttribute('r', '3');
      negCircle.setAttribute('fill', '#ef4444');
      svg.appendChild(negCircle);
    });

    chartArea.appendChild(svg);

    // X-axis labels
    const xAxisLabels = document.createElement('div');
    xAxisLabels.style.display = 'flex';
    xAxisLabels.style.justifyContent = 'space-between';
    xAxisLabels.style.paddingLeft = '20px';
    xAxisLabels.style.paddingRight = '10px';
    xAxisLabels.style.fontSize = '7px';
    xAxisLabels.style.marginTop = '5px';
    weeklyData.slice(0, pointCount).forEach((week: any) => {
      const label = document.createElement('div');
      const weekDate = week.weekStart ? new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      label.textContent = weekDate;
      xAxisLabels.appendChild(label);
    });
    chartArea.appendChild(xAxisLabels);
    chartContainer.appendChild(chartArea);
    page.appendChild(chartContainer);
  } else {
    // Fallback: simple bar chart if no weekly data
    const totalBehaviors = (behavior.positive || 0) + (behavior.negative || 0);
    if (totalBehaviors > 0) {
      const chartContainer = document.createElement('div');
      chartContainer.style.marginBottom = '20px';

      const chartLabel = document.createElement('div');
      chartLabel.textContent = 'Behavior Distribution';
      chartLabel.style.fontSize = '10px';
      chartLabel.style.marginBottom = '4px';
      chartContainer.appendChild(chartLabel);

      const barWrapper = document.createElement('div');
      barWrapper.style.width = '60%';
      barWrapper.style.height = '14px';
      barWrapper.style.display = 'flex';
      barWrapper.style.overflow = 'hidden';
      barWrapper.style.borderRadius = '4px';
      barWrapper.style.border = '1px solid #e5e7eb';

      const positivePercent = ((behavior.positive || 0) / totalBehaviors) * 100;
      const negativePercent = ((behavior.negative || 0) / totalBehaviors) * 100;

      const positiveSeg = document.createElement('div');
      positiveSeg.style.width = `${positivePercent}%`;
      positiveSeg.style.backgroundColor = '#22c55e';
      positiveSeg.title = `Positive: ${behavior.positive || 0} (${positivePercent.toFixed(1)}%)`;

    const negativeSeg = document.createElement('div');
    negativeSeg.style.width = `${negativePercent}%`;
    negativeSeg.style.backgroundColor = '#ef4444';
    negativeSeg.title = `Negative: ${behavior.negative || 0} (${negativePercent.toFixed(1)}%)`;

    barWrapper.appendChild(positiveSeg);
    barWrapper.appendChild(negativeSeg);
    chartContainer.appendChild(barWrapper);
    page.appendChild(chartContainer);
  }
}

  // Top 5 Table
  const top5Title = document.createElement('h3');
  top5Title.textContent = 'Top 5';
  top5Title.style.fontSize = '12px';
  top5Title.style.marginTop = '20px';
  top5Title.style.marginBottom = '10px';
  page.appendChild(top5Title);

  const behaviorTop5 = reportData.behavior?.top5 || {};
  const top5Table = document.createElement('table');
  top5Table.style.width = '100%';
  top5Table.style.borderCollapse = 'collapse';
  top5Table.style.fontSize = '8px';

  const headerRow = document.createElement('tr');
  const th1 = document.createElement('th');
  th1.textContent = 'Positive';
  th1.style.backgroundColor = '#22c55e';
  th1.style.color = '#ffffff';
  th1.style.border = '1px solid #000';
  th1.style.padding = '4px';
  th1.style.width = '50%';
  headerRow.appendChild(th1);

  const th2 = document.createElement('th');
  th2.textContent = 'Negative';
  th2.style.backgroundColor = '#ef4444';
  th2.style.color = '#ffffff';
  th2.style.border = '1px solid #000';
  th2.style.padding = '4px';
  th2.style.width = '50%';
  headerRow.appendChild(th2);
  top5Table.appendChild(headerRow);

  for (let i = 0; i < 5; i++) {
    const row = document.createElement('tr');
    
    const td1 = document.createElement('td');
    const positiveData = behaviorTop5.positive || [];
    if (positiveData[i]) {
      const nameDiv = document.createElement('div');
      nameDiv.textContent = positiveData[i].name || '';
      nameDiv.style.textAlign = 'right';
      nameDiv.style.marginBottom = '2px';
      nameDiv.style.fontSize = '8px';
      
      const countDiv = document.createElement('div');
      countDiv.textContent = `${positiveData[i].count || 0}`;
      countDiv.style.textAlign = 'left';
      countDiv.style.fontSize = '8px';
      countDiv.style.fontWeight = 'bold';
      
      td1.appendChild(nameDiv);
      td1.appendChild(countDiv);
    }
    td1.style.border = '1px solid #000';
    td1.style.padding = '4px';
    td1.style.minHeight = '20px';
    row.appendChild(td1);

    const td2 = document.createElement('td');
    const negativeData = behaviorTop5.negative || [];
    if (negativeData[i]) {
      const nameDiv = document.createElement('div');
      nameDiv.textContent = negativeData[i].name || '';
      nameDiv.style.textAlign = 'right';
      nameDiv.style.marginBottom = '2px';
      nameDiv.style.fontSize = '8px';
      
      const countDiv = document.createElement('div');
      countDiv.textContent = `${negativeData[i].count || 0}`;
      countDiv.style.textAlign = 'left';
      countDiv.style.fontSize = '8px';
      countDiv.style.fontWeight = 'bold';
      
      td2.appendChild(nameDiv);
      td2.appendChild(countDiv);
    }
    td2.style.border = '1px solid #000';
    td2.style.padding = '4px';
    td2.style.minHeight = '20px';
    row.appendChild(td2);

    top5Table.appendChild(row);
  }
  page.appendChild(top5Table);

  // Footer
  const footer = document.createElement('div');
  footer.style.position = 'absolute';
  footer.style.bottom = '15mm';
  footer.style.width = '100%';
  footer.style.fontSize = '10px';
  footer.style.color = '#9ca3af';
  footer.textContent = 'Page 3 of 4';
  page.appendChild(footer);

  return page;
}

export function createPage4(classItem: any, reportData: any, reportDate: string): HTMLElement {
  const page = document.createElement('div');
  page.style.width = '210mm';
  page.style.minHeight = '257mm';
  page.style.padding = '15mm';
  page.style.backgroundColor = '#ffffff';
  page.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  page.style.direction = 'rtl';
  page.style.textAlign = 'right';
  page.style.boxSizing = 'border-box';

  // Header
  const header = document.createElement('div');
  header.style.marginBottom = '15px';
  header.innerHTML = `
    <h1 style="color: #22c55e; font-size: 20px; font-weight: bold; margin: 0 0 5px 0;">
      ${classItem.subject || 'Class'}
    </h1>
    <h2 style="color: #22c55e; font-size: 16px; margin: 0 0 5px 0;">Class Report</h2>
    <p style="color: #6b7280; font-size: 12px; margin: 0;">${reportDate}</p>
  `;
  page.appendChild(header);

  // Gradebook Banner
  const banner = document.createElement('div');
  banner.style.backgroundColor = '#22c55e';
  banner.style.color = '#ffffff';
  banner.style.padding = '8px';
  banner.style.marginBottom = '15px';
  banner.textContent = 'Gradebook';
  page.appendChild(banner);

  // Average Grade of Gradable Items
  const avgTitle = document.createElement('h3');
  avgTitle.textContent = 'Average Grade of Gradable Items';
  avgTitle.style.fontSize = '12px';
  avgTitle.style.marginBottom = '10px';
  page.appendChild(avgTitle);

  // Bar Chart for Average Grades
  const assessments = reportData.gradebook?.assessments || [];
  if (assessments.length > 0) {
    const chartContainer = document.createElement('div');
    chartContainer.style.marginBottom = '20px';
    chartContainer.style.height = '200px';
    chartContainer.style.position = 'relative';
    chartContainer.style.backgroundColor = '#f9fafb';
    chartContainer.style.padding = '10px';
    chartContainer.style.borderRadius = '4px';

    // Chart area
    const chartArea = document.createElement('div');
    chartArea.style.position = 'relative';
    chartArea.style.height = '160px';
    chartArea.style.borderLeft = '2px solid #000';
    chartArea.style.borderBottom = '2px solid #000';
    chartArea.style.paddingTop = '5px';
    chartArea.style.paddingRight = '10px';

    // Y-axis labels (0-100%)
    const yAxisLabels = document.createElement('div');
    yAxisLabels.style.position = 'absolute';
    yAxisLabels.style.left = '-30px';
    yAxisLabels.style.top = '0';
    yAxisLabels.style.height = '100%';
    yAxisLabels.style.display = 'flex';
    yAxisLabels.style.flexDirection = 'column';
    yAxisLabels.style.justifyContent = 'space-between';
    yAxisLabels.style.fontSize = '8px';
    for (let i = 0; i <= 5; i++) {
      const label = document.createElement('div');
      label.textContent = `${i * 20}%`;
      yAxisLabels.appendChild(label);
    }
    chartArea.appendChild(yAxisLabels);

    // Bars container
    const barsContainer = document.createElement('div');
    barsContainer.style.display = 'flex';
    barsContainer.style.gap = '15px';
    barsContainer.style.height = '100%';
    barsContainer.style.alignItems = 'flex-end';
    barsContainer.style.paddingLeft = '10px';
    barsContainer.style.paddingRight = '10px';
    barsContainer.style.justifyContent = 'space-around';

    assessments.slice(0, 6).forEach((assessment: any) => {
      const avgGrade = assessment.averageGrade || 0;
      const maxGrade = assessment.maxGrade || 100;
      const minGrade = assessment.minGrade || 0;

      const barWrapper = document.createElement('div');
      barWrapper.style.flex = '1';
      barWrapper.style.height = '100%';
      barWrapper.style.display = 'flex';
      barWrapper.style.flexDirection = 'column';
      barWrapper.style.alignItems = 'center';
      barWrapper.style.justifyContent = 'flex-end';
      barWrapper.style.position = 'relative';

      // Bar
      const bar = document.createElement('div');
      bar.style.width = '100%';
      bar.style.height = `${(avgGrade / 100) * 100}%`;
      bar.style.backgroundColor = '#3b82f6';
      bar.style.minHeight = '4px';
      bar.style.position = 'relative';
      bar.style.borderRadius = '2px 2px 0 0';

      // Max indicator (green triangle)
      if (maxGrade > 0) {
        const maxIndicator = document.createElement('div');
        maxIndicator.style.position = 'absolute';
        maxIndicator.style.top = `${100 - (maxGrade / 100) * 100}%`;
        maxIndicator.style.left = '50%';
        maxIndicator.style.transform = 'translateX(-50%)';
        maxIndicator.style.width = '0';
        maxIndicator.style.height = '0';
        maxIndicator.style.borderLeft = '4px solid transparent';
        maxIndicator.style.borderRight = '4px solid transparent';
        maxIndicator.style.borderBottom = '6px solid #22c55e';
        bar.appendChild(maxIndicator);
      }

      // Min indicator (red dot)
      if (minGrade > 0) {
        const minIndicator = document.createElement('div');
        minIndicator.style.position = 'absolute';
        minIndicator.style.top = `${100 - (minGrade / 100) * 100}%`;
        minIndicator.style.left = '50%';
        minIndicator.style.transform = 'translateX(-50%)';
        minIndicator.style.width = '6px';
        minIndicator.style.height = '6px';
        minIndicator.style.borderRadius = '50%';
        minIndicator.style.backgroundColor = '#ef4444';
        bar.appendChild(minIndicator);
      }

      // Assessment label
      const label = document.createElement('div');
      label.style.fontSize = '8px';
      label.style.textAlign = 'center';
      label.style.marginTop = '3px';
      label.style.transform = 'rotate(-45deg)';
      label.style.transformOrigin = 'center';
      label.textContent = assessment.nameAr || assessment.name || 'Item';
      label.style.whiteSpace = 'nowrap';

      barWrapper.appendChild(bar);
      barWrapper.appendChild(label);
      barsContainer.appendChild(barWrapper);
    });

    chartArea.appendChild(barsContainer);
    chartContainer.appendChild(chartArea);

    // Legend
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.gap = '15px';
    legend.style.justifyContent = 'center';
    legend.style.marginTop = '8px';
    legend.style.fontSize = '8px';

    const avgLegend = document.createElement('div');
    avgLegend.style.display = 'flex';
    avgLegend.style.alignItems = 'center';
    const avgBox = document.createElement('span');
    avgBox.style.width = '12px';
    avgBox.style.height = '12px';
    avgBox.style.backgroundColor = '#3b82f6';
    avgBox.style.marginLeft = '4px';
    const avgLabel = document.createElement('span');
    avgLabel.textContent = 'Average';
    avgLegend.appendChild(avgBox);
    avgLegend.appendChild(avgLabel);

    const maxLegend = document.createElement('div');
    maxLegend.style.display = 'flex';
    maxLegend.style.alignItems = 'center';
    const maxTriangle = document.createElement('span');
    maxTriangle.style.width = '0';
    maxTriangle.style.height = '0';
    maxTriangle.style.borderLeft = '4px solid transparent';
    maxTriangle.style.borderRight = '4px solid transparent';
    maxTriangle.style.borderBottom = '6px solid #22c55e';
    maxTriangle.style.marginLeft = '4px';
    const maxLabel = document.createElement('span');
    maxLabel.textContent = 'Highest';
    maxLegend.appendChild(maxTriangle);
    maxLegend.appendChild(maxLabel);

    const minLegend = document.createElement('div');
    minLegend.style.display = 'flex';
    minLegend.style.alignItems = 'center';
    const minDot = document.createElement('span');
    minDot.style.width = '6px';
    minDot.style.height = '6px';
    minDot.style.borderRadius = '50%';
    minDot.style.backgroundColor = '#ef4444';
    minDot.style.marginLeft = '4px';
    const minLabel = document.createElement('span');
    minLabel.textContent = 'Lowest';
    minLegend.appendChild(minDot);
    minLegend.appendChild(minLabel);

    legend.appendChild(avgLegend);
    legend.appendChild(maxLegend);
    legend.appendChild(minLegend);
    chartContainer.appendChild(legend);

    page.appendChild(chartContainer);
  }

  // Weighted Gradable Items (weight chart)
  const weightedTitle = document.createElement('h3');
  weightedTitle.textContent = 'Weighted Gradable Items';
  weightedTitle.style.fontSize = '12px';
  weightedTitle.style.marginTop = '10px';
  weightedTitle.style.marginBottom = '10px';
  page.appendChild(weightedTitle);

  const assessmentsForWeight = reportData.gradebook?.assessments || [];
  const totalWeight = assessmentsForWeight.reduce((sum: number, a: any) => sum + (a.totalWeight || 0), 0);
  
  if (totalWeight > 0 && assessmentsForWeight.length > 0) {
    const chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.marginBottom = '20px';
    chartContainer.style.gap = '20px';
    chartContainer.style.alignItems = 'center';

    // Pie Chart
    const svgSize = 150;
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const radius = 60;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', svgSize.toString());
    svg.setAttribute('height', svgSize.toString());
    svg.style.display = 'block';

    const colors = ['#22c55e', '#ef4444', '#3b82f6', '#f97316', '#eab308', '#8b5cf6', '#6366f1'];
    let currentAngle = -90;

    assessmentsForWeight.forEach((assessment: any, index: number) => {
      const weight = assessment.totalWeight || 0;
      if (weight === 0) return;
      
      const percentage = (weight / totalWeight) * 100;
      const angle = (percentage / 100) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArc = angle > 180 ? 1 : 0;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const d = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      path.setAttribute('d', d);
      path.setAttribute('fill', colors[index % colors.length]);
      path.setAttribute('stroke', '#ffffff');
      path.setAttribute('stroke-width', '2');
      svg.appendChild(path);

      currentAngle = endAngle;
    });

    chartContainer.appendChild(svg);

    // Legend
    const legend = document.createElement('div');
    legend.style.flex = '1';
    assessmentsForWeight.forEach((assessment: any, index: number) => {
      const weight = assessment.totalWeight || 0;
      if (weight === 0) return;
      
      const percentage = (weight / totalWeight) * 100;
      const legendItem = document.createElement('div');
      legendItem.style.marginBottom = '6px';
      legendItem.style.display = 'flex';
      legendItem.style.alignItems = 'center';
      legendItem.style.fontSize = '9px';

      const colorBox = document.createElement('span');
      colorBox.style.display = 'inline-block';
      colorBox.style.width = '12px';
      colorBox.style.height = '12px';
      colorBox.style.backgroundColor = colors[index % colors.length];
      colorBox.style.marginLeft = '8px';
      colorBox.style.border = '1px solid #ccc';

      const labelSpan = document.createElement('span');
      labelSpan.textContent = `${assessment.nameAr || assessment.name}: ${percentage.toFixed(1)}%`;

      legendItem.appendChild(colorBox);
      legendItem.appendChild(labelSpan);
      legend.appendChild(legendItem);
    });
    chartContainer.appendChild(legend);
    page.appendChild(chartContainer);
  }

  // Grades Summary
  const summaryTitle = document.createElement('h3');
  summaryTitle.textContent = 'Grades Summary by No. of Students';
  summaryTitle.style.fontSize = '12px';
  summaryTitle.style.marginTop = '20px';
  summaryTitle.style.marginBottom = '10px';
  page.appendChild(summaryTitle);

  const gradeDist = reportData.gradebook?.gradeDistribution || {};
  const gradeLabels = ['A', 'B', 'C', 'D', 'F'];
  const gradeColors = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444'];
  const tilesDiv = document.createElement('div');
  tilesDiv.style.display = 'flex';
  tilesDiv.style.gap = '10px';
  tilesDiv.style.marginTop = '10px';

  gradeLabels.forEach((grade, index) => {
    const tile = document.createElement('div');
    tile.style.flex = '1';
    tile.style.height = '60px';
    tile.style.backgroundColor = gradeColors[index];
    tile.style.color = '#ffffff';
    tile.style.display = 'flex';
    tile.style.flexDirection = 'column';
    tile.style.alignItems = 'center';
    tile.style.justifyContent = 'center';
    tile.style.fontSize = '16px';
    tile.style.fontWeight = 'bold';
    tile.innerHTML = `
      <div>${grade}</div>
      <div style="font-size: 12px; margin-top: 5px;">${gradeDist[grade] || 0}</div>
    `;
    tilesDiv.appendChild(tile);
  });
  page.appendChild(tilesDiv);

  // Footer
  const footer = document.createElement('div');
  footer.style.position = 'absolute';
  footer.style.bottom = '15mm';
  footer.style.width = '100%';
  footer.style.fontSize = '10px';
  footer.style.color = '#9ca3af';
  footer.textContent = 'Page 4 of 4';
  page.appendChild(footer);

  return page;
}

