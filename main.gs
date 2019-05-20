// TODO : 勤務開始時間　休憩開始時間　経過時間の常時表示（html）
// TODO : 出勤：前回の退勤時間と比較しエラーチェック
// TODO : 直近3件のデータはWebAppから確認(余裕があれば修正も)可能に
// TODO : try catchでエラー時return -5

// 勤務情報訂正
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
function fixWorkInfo(place,descriptions){
  var tcS=nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  if(getState(record,lastRow)=="off")return -1;
  record = [[place,descriptions]];
  tcS.getRange(lastRow,3,1,2).setValues(record);
  
  return 0;
}

// 出勤
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
function goToWork(date,place,descriptions,hour,minute){
  var tcS=nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  if(getState(record,lastRow)!="off")return -1;
  if(!date)date=getToday();
  tcS.insertRowAfter(lastRow);
  lastRow+=1;
  tcS.getRange(1,2,1,14).copyTo(tcS.getRange(lastRow,2,1,14));
  var time = parseElapsedTime(hour,minute);
  record = [[date,place,descriptions,time]];
  tcS.getRange(lastRow,2,1,4).setValues(record);
  
  return 0;
}

function test(){
  //Logger.log(goToWork("","place","hoge",10,00));
  Logger.log(takeRecess(getToday(),12,00));
  //Logger.log(endRecess(12,00));
  //leaveWork(17,00);
  //Logger.log(findDiffOfDate("2019/5/20","2019-05-21"));
}

// 休憩開始
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
//        : -2 異常終了：休憩回数上限超過
//        : -3 異常終了：入力時間が前回休憩より前
//        : -4 異常終了：入力時間が勤務開始より前
function takeRecess(date,hour,minute){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態が正しいか確認
  if(getState(record,lastRow)!="inWork")return -1;
  Logger.log("takeRecess");

  // 休憩回数確認
  if(record[0][10])return -2;
  // 時間が適切か確認
  hour = hour -0+ (24 * findDiffOfDate(record[0][0],date));
  var recessIndex = isTimeApropos(record,hour,minute);
  if(recessIndex < 0)return recessIndex;
  
  // 書込
  var time = parseElapsedTime(hour,minute);
  tcS.getRange(lastRow,recessIndex+2).setValue(time);
  return 0;
}

// 休憩終了
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
//        : -3 異常終了：入力時間が休憩開始より前
function endRecess(date,hour,minute){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態確認
  if(getState(record,lastRow)!="inRecess")return -1;
  Logger.log("endRecess");
  
  // 時間が適切か確認
  hour = hour -0+ (24 * findDiffOfDate(record[0][0],date));
  var recessIndex= isTimeApropos(record,hour,minute);
  if(recessIndex < 0)return recessIndex;
  
  //書込
  var time = parseElapsedTime(hour,minute);
  tcS.getRange(lastRow,recessIndex+2).setValue(time);
  return 0;
}


// 退勤
// return :  0 正常終了
//        : -1 異常終了：不正な状態遷移
//        : -2 異常終了：休憩回数上限超過
//        : -3 異常終了：入力時間が前回休憩より前
//        : -4 異常終了：入力時間が勤務開始より前
function leaveWork(date,hour,minute){
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

  // 時間が適切か確認
  hour = hour -0+ (24 * findDiffOfDate(record[0][0],date));
  var recessIndex= isTimeApropos(record,hour,minute);
  if(recessIndex < 0)return recessIndex;
  
  // 書込
  var time = parseElapsedTime(hour,minute)
  tcS.getRange(lastRow,6).setValue(time);
  return 0;
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

// スプレッドシート用　経過時間を表すフォーマットに変換
// arg    : hour:時 min:分
// return : 経過時間 hh:mm:00.000
function parseElapsedTime(hour,min){
  return (hour+":"+(("00"+(min)).slice(-2))+":00.000");
}

// 入力時間は適切か確認
// return : more than 1(次に休憩時間を書き込む場所を示す) 適切＝正常
//        : -3 異常：入力時間が前回休憩より前
//        : -4 異常：入力時間が勤務開始より前
function isTimeApropos(record,hour,minute){
  var recessIndex =  6;
  while(record[0][recessIndex]&&recessIndex<=12){
    recessIndex+=1;
  }

  // 時間の矛盾を確認
  if(recessIndex>6){
    var preRecessTime = record[0][recessIndex-1];
    var preRecessHour = Math.floor((preRecessTime-new Date("1899/12/30"))/3600000);
    var preRecessMin  = preRecessTime.getMinutes();
    if(isLater(hour,minute,preRecessHour,preRecessMin)==1)return -3;
  }
  var startWorkTime = record[0][3];
  var startWorkHour = startWorkTime.getHours();
  var startWorkMin  = startWorkTime.getMinutes();
  if(isLater(hour,minute,startWorkHour,startWorkMin)==1)return -4;
  return recessIndex;
}