// ===== 皇家大衛英文閱讀集點站 ─ Google 試算表後端 =====
// 貼到「擴充功能 → Apps Script」後，部署為網頁應用程式（執行身分：我；存取權：所有人），
// 把部署後的網址貼進網站 config.js 的 sheetUrl。

var SHEET_NAME = '紀錄';
var HEADERS = ['時間','姓名','班級代碼','班級','等級','單元','標題','答對題數','得點','獎勵點','是否計分'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sh.getLastRow() === 0 || String(sh.getRange(1,1).getValue()).trim() === '' ) {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  if (sh.getName() !== SHEET_NAME) sh.setName(SHEET_NAME);
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 學生交卷：POST 一筆紀錄
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    var now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
    sh.appendRow([now, d.name, d.code, d.className, d.level, d.unit, d.title,
                  Number(d.correct), Number(d.score), Number(d.bonus), d.counted ? '是' : '否']);
    return json_({ok:true});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  }
}

// 讀取：?action=all（老師看全部） 或 ?action=student&name=王小明&code=RD2026（學生還原自己的點數）
function doGet(e) {
  try {
    var p = e.parameter || {};
    var sh = getSheet_();
    var rows = sh.getLastRow() > 1 ? sh.getRange(2,1,sh.getLastRow()-1,HEADERS.length).getValues() : [];
    var recs = rows.map(function(r){
      return {time:String(r[0]), name:String(r[1]), code:String(r[2]), className:String(r[3]), level:String(r[4]),
              unit:String(r[5]), title:String(r[6]), correct:Number(r[7]), score:Number(r[8]), bonus:Number(r[9]), counted:String(r[10])==='是'};
    });
    if (p.action === 'student') {
      recs = recs.filter(function(r){ return r.name === String(p.name) && r.code === String(p.code); });
    } else if (p.action !== 'all') {
      return json_({ok:true, message:'皇家大衛英文閱讀集點站 後端運作中'});
    }
    return json_({ok:true, records:recs});
  } catch (err) {
    return json_({ok:false, error:String(err)});
  }
}
