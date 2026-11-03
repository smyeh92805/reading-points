// ===== 皇家大衛英文閱讀集點站 設定檔（老師可自行修改） =====
window.SITE_CONFIG = {
  siteName: "皇家大衛英文閱讀集點站",
  siteNameEn: "Royal David Reading Points",
  // 班級代碼：學生登入時輸入「姓名＋班級代碼」。左邊是代碼（學生輸入），右邊是班級名稱。
  classCodes: {
    "RD2026": "皇家大衛補習班",
    "GEPT1": "英檢初級班",
    "GEPT2": "英檢中級班"
  },
  // 老師驗證碼：在登入頁輸入此代碼可進入「老師後台」，看全班點數紀錄。
  teacherCode: "DAVID2026",
  // Google 試算表後端（Apps Script 網頁應用程式網址，以 /exec 結尾）。
  // 填入後：學生每次交卷自動寫入試算表、換裝置點數不會掉、老師後台可看全班紀錄。留空則只存在學生瀏覽器。
  sheetUrl: "https://script.google.com/macros/s/AKfycbztep81n20I0CWzxHeVcH23Ct9qCL0_62DvPShqfS-h3U5r0CbfRJNMJ_eXwuDvBiVO/exec",
  // 點數規則
  pointsPerQuestion: 1,   // 每題答對得點
  perfectBonus: 5,        // 10 題全對額外獎勵
  // 點數證明碼的簽章鹽（改了之後舊的證明碼會失效）
  salt: "RoyalDavid-ReadingLab"
};
