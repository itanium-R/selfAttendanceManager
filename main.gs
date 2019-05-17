function doGet() {
  return HtmlService.createTemplateFromFile("index").evaluate()
    .setTitle('セルフ勤怠くん')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 出勤
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
function goToWork(date,place,descriptions,hour,minute){
  var tcS=nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  if(getState(record,lastRow)!="off")return -1;
  Logger.log("Work");
  if(!date)date=getDate();
  lastRow+=1;
  tcS.getRange(1,2,1,14).copyTo(tcS.getRange(lastRow,2,1,14));
  var time = (("00"+parseInt(hour)).slice(-2))+":"+(("00"+parseInt(minute)).slice(-2));
  record = [[date,place,descriptions,time]];
  tcS.getRange(lastRow,2,1,4).setValues(record);
  
  return 0;
}

function test(){
  //Logger.log(goToWork("","place","hoge",10,00));
  //Logger.log(takeRecess(12,00));
  //Logger.log(endRecess(12,00));
  leaveWork(17,00);
}

// 休憩開始
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
//        : -2 異常終了：休憩回数上限超過
//        : -3 異常終了：入力時間が前回休憩より前
//        : -4 異常終了：入力時間が勤務開始より前
function takeRecess(hour,minute){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態が正しいか確認
  if(getState(record,lastRow)!="inWork")return -1;
  Logger.log("takeRecess");

  // 休憩回数確認
  if(record[0][10])return -2;
  var             recessIndex =  6;
  if(record[0][6])recessIndex =  8;
  if(record[0][8])recessIndex = 10;

  // 時間の矛盾を確認
  if(recessIndex>6){
    var preRecessTime = record[0][recessIndex-1];
    var preRecessHour = preRecessTime.getHours();
    var preRecessMin  = preRecessTime.getMinutes();
    if(isLater(hour,minute,preRecessHour,preRecessMin)==1)return -3;
  }
  var startWorkTime = record[0][3];
  var startWorkHour = startWorkTime.getHours();
  var startWorkMin  = startWorkTime.getMinutes();
  if(isLater(hour,minute,startWorkHour,startWorkMin)==1)return -4;

  // 書込
  var time = (("00"+parseInt(hour)).slice(-2))+":"+(("00"+parseInt(minute)).slice(-2));
  tcS.getRange(lastRow,recessIndex+2).setValue(time);
  return 0;
}



// 休憩終了
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
//        : -3 異常終了：入力時間が休憩開始より前
function endRecess(hour,minute){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態確認
  if(getState(record,lastRow)!="inRecess")return -1;
  Logger.log("endRecess");
  
  // 休憩回数取得
  var              recessIndex =  7;
  if(record[0][ 8])recessIndex =  9;
  if(record[0][10])recessIndex = 11;
  
  // 前回休憩の時刻的矛盾を確認
  var startRecessTime = record[0][recessIndex-1];
  var startRecessHour = startRecessTime.getHours();
  var startRecessMin  = startRecessTime.getMinutes();
  if(isLater(hour,minute,startRecessHour,startRecessMin)==1)return -3;

  //書込
  var time = (("00"+parseInt(hour)).slice(-2))+":"+(("00"+parseInt(minute)).slice(-2));
  tcS.getRange(lastRow,recessIndex+2).setValue(time);
  return 0;
}


// 退勤
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
//        : -2 異常終了：休憩回数上限超過
//        : -3 異常終了：入力時間が前回休憩より前
//        : -4 異常終了：入力時間が勤務開始より前
function leaveWork(hour,minute){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態が正しいか確認
  if(getState(record,lastRow)!="inWork")return -1;
  Logger.log("leaveWork");

  // 休憩回数確認
  var              recessIndex =  7;
  if(record[0][ 9])recessIndex =  9;
  if(record[0][11])recessIndex = 11;

  // 時間の矛盾を確認
  if(recessIndex>7){
    var preRecessTime = record[0][recessIndex];
    var preRecessHour = preRecessTime.getHours();
    var preRecessMin  = preRecessTime.getMinutes();
    if(isLater(hour,minute,preRecessHour,preRecessMin)==1)return -3;
  }
  var startWorkTime = record[0][3];
  var startWorkHour = startWorkTime.getHours();
  var startWorkMin  = startWorkTime.getMinutes();
  if(isLater(hour,minute,startWorkHour,startWorkMin)==1)return -4;

  // 書込
  var time = (("00"+parseInt(hour)).slice(-2))+":"+(("00"+parseInt(minute)).slice(-2));
  tcS.getRange(lastRow,6).setValue(time);
  return 0;
}



function getDate(){
  var now = new Date();
  now = Utilities.formatDate(now,'JST','yyyy/MM/dd');
  return now;
}
function getNow(){
  var now = new Date();
  now = Utilities.formatDate(now,'JST','yyyy/MM/dd HH:mm:ss');
  return now;
}
// 状態を返す
// arg[0]:最後のレコード arg[1]:最後の列の列番号　　
// return : off       : 出勤前
//          inWork    : 勤務中
//          inRecess  : 休憩中
//      
function getState(record,lastRow){
  var off     = "off";       // 出勤前の戻り値
  var inWork  = "inWork";    // 勤務中の戻り値
  var inRecess= "inRecess";  // 休憩中の戻り値
  if(lastRow<=2)                   return off;
  if(record[0][ 3]&& record[0][ 4])return off;
  if(record[0][ 6]&&!record[0][ 7])return inRecess;
  if(record[0][ 8]&&!record[0][ 9])return inRecess;
  if(record[0][10]&&!record[0][11])return inRecess;
  return inWork;
}
    
//------------------------------------------------------------

// 時間を比較する　基準time0に対してtime1が遅いか判定
// arg    : time0の時間と分　hour0,min0
// arg    : time1の時間と分　hour1,min1
// return : 0 : hour0;min0 のほうが大きいか等しい
// return : 1 : hour1;min1 のほうが大きい
function isLater(hour0,min0,hour1,min1){
  var time0=parseInt(hour0)*100+parseInt(min0);
  var time1=parseInt(hour1)*100+parseInt(min1);
  if(time0<time1)return 1;
  else           return 0;
}

function sendToHtml_state(){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態確認
  var state =getState(record,lastRow);
  if(state=="inWork")  return "勤務中";
  if(state=="inRecess")return "休憩中";
  if(state=="off")     return "未出勤";
  
}
//------------------------------------------------------------

//アクティブスプレッドシートのnameシートを開く函数
function nameOpen(name){
  try{
    const ss = SpreadsheetApp.getActiveSpreadsheet(); //アクティブスプレッドシートを開く->ss
    const sss = ss.getSheetByName(name);              //nameという名前のシートを開く->sss
  }catch(e){                                          //エラー発生時は表示
    Browser.msgBox("シートを開けませんでした");
  }
  return sss;
}




//idスプレッドシートのnameシートを開く函数
function Sopen(id,name){
  try{
    const ss = SpreadsheetApp.openById(id);           //idスプレッドシートを開く->ss
    const sss = ss.getSheetByName(name);              //nameシートを開く->sss
  }catch(e){                                          //エラー発生時は表示
    Browser.msgBox("シートを開けませんでした ： "+e.message);
  }
  return sss;
}


