import type { Guest } from '../../../preload/index.d'

interface ExportButtonProps {
  guests: Guest[]
}

export default function ExportButton({ guests }: ExportButtonProps): React.JSX.Element {
  const handleExport = (): void => {
    const totalAmount = guests.reduce((s, g) => s + g.amount, 0)
    const totalTickets = guests.reduce((s, g) => s + g.meal_tickets, 0)
    const totalCount = guests.length
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0

    const relMap: Record<string, { count: number; total: number }> = {}
    guests.forEach((g) => {
      const rel = g.relationship || '미지정'
      if (!relMap[rel]) relMap[rel] = { count: 0, total: 0 }
      relMap[rel].count++
      relMap[rel].total += g.amount
    })

    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>축의금 명단 — ${dateStr}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans KR',sans-serif;background:#FAFAFF;color:#333;padding:24px}
.container{max-width:900px;margin:0 auto}
h1{color:#8B5CF6;font-size:20px;text-align:center;margin-bottom:24px}
.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.card{background:#F5F3FF;border-radius:12px;padding:16px;text-align:center}
.card .label{font-size:11px;color:#888;margin-bottom:4px}
.card .value{font-size:20px;font-weight:700;color:#F59E0B}
.card .value.text{color:#333}
.search-box{margin-bottom:16px}
.search-box input{width:100%;padding:10px 16px;border:1px solid #DDD6FE;border-radius:8px;font-size:13px;font-family:'Noto Sans KR',sans-serif}
.rel-select{width:100%;padding:4px;border:1px solid #DDD6FE;border-radius:4px;background:#fff;font-family:'Noto Sans KR',sans-serif;font-size:12px;outline:none}
.rel-select:focus{border-color:#8B5CF6}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px}
thead{background:#C4B5FD;color:#fff}
th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700}
th.right{text-align:right}
th.center{text-align:center}
td{padding:8px 12px;border-bottom:1px solid #EDE9FE}
tr:nth-child(even){background:#FAFAFF}
td.right{text-align:right}
td.center{text-align:center}
td.amount{font-weight:700;color:#F59E0B;text-align:right}
.sum-row th{background:#8B5CF6;color:#fff;font-weight:700;padding:10px 12px}
h2{color:#8B5CF6;font-size:14px;margin-bottom:12px}
.chart-container { position: relative; height: 250px; width: 100%; margin-bottom: 24px; }
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
<div class="container">
<h1>💒 축의금 명단</h1>

<div class="summary">
<div class="card"><div class="label">총 축의금</div><div class="value">${totalAmount.toLocaleString()}원</div></div>
<div class="card"><div class="label">총 식권</div><div class="value text">${totalTickets.toLocaleString()}장</div></div>
<div class="card"><div class="label">총 인원</div><div class="value text">${totalCount.toLocaleString()}명</div></div>
<div class="card"><div class="label">1인 평균</div><div class="value">${avgAmount.toLocaleString()}원</div></div>
</div>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
  <div class="search-box" style="margin-bottom: 0; flex: 1; margin-right: 12px;">
    <input type="text" id="searchInput" placeholder="🔍 이름으로 검색..." oninput="filterTable()">
  </div>
  <button type="button" onclick="downloadExcel()" style="padding: 10px 16px; background: #10B981; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; font-family: 'Noto Sans KR', sans-serif; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    📊 엑셀 다운로드
  </button>
</div>

<table id="guestTable">
<thead>
<tr class="sum-row"><th colspan="2">합계</th><th class="right">${totalAmount.toLocaleString()}원</th><th class="center">${totalTickets}</th><th colspan="3"></th></tr>
<tr>
<th>#</th><th>이름</th><th class="right">축의금</th><th class="center">식권</th><th>전달방법</th><th>관계</th><th>메모</th>
</tr>
</thead>
<tbody>
${guests
  .map((g, i) => {
    const RELATIONSHIPS = [
      '친구',
      '직장동료',
      '친척',
      '선후배',
      '어머니 지인',
      '아버지 지인',
      '기타'
    ]
    const relOptions =
      `<option value="">-</option>` +
      RELATIONSHIPS.map(
        (r) => `<option value="${r}" ${g.relationship === r ? 'selected' : ''}>${r}</option>`
      ).join('')
    return `<tr>
<td>${i + 1}</td><td>${escapeHtml(g.name)}</td><td class="amount">${g.amount.toLocaleString()}원</td><td class="center">${g.meal_tickets}</td><td>${escapeHtml(g.delivery_method || '-')}</td><td><select class="rel-select" data-amount="${g.amount}" onchange="updateAnalytics()">${relOptions}</select></td><td>${escapeHtml(g.memo || '')}</td>
</tr>`
  })
  .join('\n')}
</tbody>
</table>

<h2>관계별 분석</h2>
<div class="chart-container">
  <canvas id="relChart"></canvas>
</div>
<table>
<thead><tr><th>관계</th><th class="center">인원</th><th class="right">총 금액</th><th class="right">평균</th></tr></thead>
<tbody id="analyticsBody">
</tbody>
</table>
</div>

<script>
function filterTable(){
  var q=document.getElementById('searchInput').value.toLowerCase();
  var rows=document.getElementById('guestTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
  for(var i=0;i<rows.length;i++){
    var name=rows[i].cells[1].textContent.toLowerCase();
    rows[i].style.display=name.indexOf(q)>-1?'':'none';
  }
}

function updateAnalytics() {
  var selects = document.querySelectorAll('.rel-select');
  var stats = {};
  for(var i=0; i<selects.length; i++) {
    var rel = selects[i].value || '-';
    var amount = parseInt(selects[i].getAttribute('data-amount'), 10);
    if(!stats[rel]) {
      stats[rel] = { count: 0, total: 0 };
    }
    stats[rel].count++;
    stats[rel].total += amount;
  }
  
  var tbody = document.getElementById('analyticsBody');
  var html = '';
  var order = ['친구', '직장동료', '친척', '선후배', '어머니 지인', '아버지 지인', '기타', '-'];
  
  var chartLabels = [];
  var chartData = [];
  var CHART_COLORS = ['#3B5998', '#5B8DB8', '#7FB3D3', '#C9A84C', '#9E9E9E', '#607D8B', '#8D6E63'];
  var chartBg = [];
  var colorIndex = 0;

  for(var j=0; j<order.length; j++) {
    var key = order[j];
    if(stats[key]) {
      var s = stats[key];
      var avg = Math.round(s.total / s.count);
      html += '<tr><td>' + key + '</td><td class="center">' + s.count + '명</td><td class="amount">' + s.total.toLocaleString() + '원</td><td class="amount">' + avg.toLocaleString() + '원</td></tr>';
      
      chartLabels.push(key);
      chartData.push(s.total);
      chartBg.push(CHART_COLORS[colorIndex % CHART_COLORS.length]);
      colorIndex++;
      
      delete stats[key];
    }
  }
  for(var key in stats) {
    if(stats.hasOwnProperty(key)) {
      var s = stats[key];
      var avg = Math.round(s.total / s.count);
      html += '<tr><td>' + key + '</td><td class="center">' + s.count + '명</td><td class="amount">' + s.total.toLocaleString() + '원</td><td class="amount">' + avg.toLocaleString() + '원</td></tr>';
      
      chartLabels.push(key);
      chartData.push(s.total);
      chartBg.push(CHART_COLORS[colorIndex % CHART_COLORS.length]);
      colorIndex++;
    }
  }
  tbody.innerHTML = html;
  
  // ---------------- Update Chart ----------------
  var ctx = document.getElementById('relChart');
  if (window.myRelChart) {
    window.myRelChart.data.labels = chartLabels;
    window.myRelChart.data.datasets[0].data = chartData;
    window.myRelChart.data.datasets[0].backgroundColor = chartBg;
    window.myRelChart.update();
  } else {
    window.myRelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: '축의금 합계 (원)',
          data: chartData,
          backgroundColor: chartBg,
          borderRadius: 4
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }
}

function downloadExcel() {
  var rows = document.querySelectorAll("#guestTable tr");
  var csv = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].style.display === 'none') continue; // 검색 시 보이는 행만 포함
    var row = [], cols = rows[i].querySelectorAll("td, th");
    for (var j = 0; j < cols.length; j++) {
      var select = cols[j].querySelector('select');
      var text = select ? select.value : cols[j].innerText;
      text = text.replace(/"/g, '""').trim();
      row.push('"' + text + '"');
    }
    csv.push(row.join(","));
  }
  
  var csvContent = "\\uFEFF" + csv.join("\\n");
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "축의금_명단_정리.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 초기 로딩 시 분석 표 렌더링
window.onload = function() {
  updateAnalytics();
};
</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `축의금_명단_${dateStr}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={guests.length === 0}
      className="export-btn"
    >
      📤 공유용 내보내기
    </button>
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
