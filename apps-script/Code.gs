// ===== 皇家大衛英文閱讀集點站 ─ Google 試算表後端（v2）=====
// 貼到「擴充功能 → Apps Script」後，部署為網頁應用程式（執行身分：我；存取權：所有人）。
// 更新程式後：部署 → 管理部署作業 → 鉛筆 → 版本「新版本」→ 部署（網址不變）。
//
// v2 變更：
//  * 「紀錄」工作表最底下固定一列「得點總計」（新紀錄會插在總計列上方）
//  * 自動建立「學生總表」工作表（每位學生的得點、獎勵點、總點數、完成單元數）
//  * 回傳給網站的時間一律用台灣時間（Asia/Taipei）

var SHEET_NAME = '紀錄';
var SUMMARY_NAME = '學生總表';
var TOTAL_LABEL = '得點總計';
var TZ = 'Asia/Taipei';
var HEADERS = ['時間','姓名','班級代碼','班級','等級','單元','標題','答對題數','得點','獎勵點','是否計分'];

function fmt_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd HH:mm:ss');
  return String(v);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sh.getLastRow() === 0 || String(sh.getRange(1,1).getValue()).trim() === '') {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  if (sh.getName() !== SHEET_NAME) sh.setName(SHEET_NAME);
  ensureTotalRow_(sh);
  ensureSummary_(ss);
  return sh;
}

// 找到總計列的列號；沒有就建立一列在最底下
function ensureTotalRow_(sh) {
  var last = sh.getLastRow();
  if (last >= 2 && String(sh.getRange(last,1).getValue()) === TOTAL_LABEL) return last;
  var row = last + 1;
  sh.getRange(row,1,1,HEADERS.length).setValues([[
    TOTAL_LABEL,'','','','','','','=COUNTIF(K:K,"是")',
    '=SUMIF(K:K,"是",I:I)','=SUMIF(K:K,"是",J:J)','=I'+row+'+J'+row
  ]]);
  sh.getRange(row,1,1,HEADERS.length).setFontWeight('bold').setBackground('#fdf3d0');
  sh.getRange(row,8).setNote('計分次數');
  sh.getRange(row,11).setNote('得點＋獎勵點 合計');
  return row;
}

function ensureSummary_(ss) {
  if (ss.getSheetByName(SUMMARY_NAME)) return;
  var s = ss.insertSheet(SUMMARY_NAME);
  s.getRange('A1').setFormula(
    '=QUERY(紀錄!A:K,"select B, C, D, sum(I), sum(J), count(F) where K=\'是\' group by B, C, D ' +
    'label B \'姓名\', C \'班級代碼\', D \'班級\', sum(I) \'得點\', sum(J) \'獎勵點\', count(F) \'完成單元\'",1)');
  s.getRange('G1').setValue('總點數');
  s.getRange('G2').setFormula('=ARRAYFORMULA(IF(A2:A="","",D2:D+E2:E))');
  s.getRange('A1:G1').setFontWeight('bold').setBackground('#e8eefb');
  s.setFrozenRows(1);
  s.setColumnWidth(1, 120); s.setColumnWidth(3, 120);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 學生交卷：POST 一筆紀錄（插在總計列上方）
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var d = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    var totalRow = ensureTotalRow_(sh);
    var now = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss');
    sh.insertRowBefore(totalRow);
    sh.getRange(totalRow,1,1,HEADERS.length)
      .setValues([[now, d.name, d.code, d.className, d.level, d.unit, d.title,
                   Number(d.correct), Number(d.score), Number(d.bonus), d.counted ? '是' : '否']])
      .setFontWeight('normal').setBackground(null);
    sh.getRange(totalRow,1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    return json_({ok:true});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// 讀取：?action=all（老師看全部） 或 ?action=student&name=王小明&code=RD2026（學生還原自己的點數）
function doGet(e) {
  try {
    var p = e.parameter || {};
    var sh = getSheet_();
    var rows = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,HEADERS.length).getValues() : [];
    var recs = [];
    rows.forEach(function(r){
      if (String(r[0]) === TOTAL_LABEL || String(r[1]) === '') return;   // 跳過總計列與空列
      recs.push({time:fmt_(r[0]), name:String(r[1]), code:String(r[2]), className:String(r[3]), level:String(r[4]),
                 unit:String(r[5]), title:String(r[6]), correct:Number(r[7]), score:Number(r[8]), bonus:Number(r[9]), counted:String(r[10])==='是'});
    });
    if (p.action === 'student') {
      recs = recs.filter(function(r){ return r.name === String(p.name) && r.code === String(p.code); });
    } else if (p.action !== 'all') {
      return json_({ok:true, message:'皇家大衛英文閱讀集點站 後端運作中 v2'});
    }
    return json_({ok:true, records:recs});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  }
}
