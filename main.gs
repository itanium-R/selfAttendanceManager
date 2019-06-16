// 勤務情報訂正
// @param  :   place:場所  descriptions:作業内容
// @return :  0 正常終了
//         : -1 異常終了：不正な状態遷移
function fixWorkInfo(place,descriptions){
  var tcS=nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  if(getState(record,lastRow)=="off")return -1;
  record = [[place,descriptions]];
  tcS.getRange(lastRow,3,1,2).setValues(record);
  
  return 0;
}

// 出勤登録
// @paran  :   date:日付   hour:時   minute:分
//         :   place:場所  descriptions:作業内容
// @return :  0 正常終了
//         : -1 異常終了：不正な状態遷移
//         : -5 異常終了：出勤時刻が前回退勤時刻より前
function goToWork(date,place,descriptions,hour,minute){
  var tcS=nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  // エラー処理
  if(getState(record,lastRow)!="off")return -1;
  if(lastRow>2){
    var lastLeave = new Date(Utilities.formatDate(record[0][0],'JST','yyyy/MM/dd') 
                           + Utilities.formatDate(record[0][4],'JST',' HH:mm:ss'));
    var input     = new Date(date+" "+hour+":"+minute);
    if(lastLeave>input)return -5;
  }
  // レコード追加
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

// 休憩開始登録
// @paran  :   date:日付   hour:時   minute:分
// @return :  0 正常終了
//         : -1 異常終了：不正な状態遷移
//         : -2 異常終了：休憩回数上限超過
//         : -3 異常終了：入力時間が前回休憩より前
//         : -4 異常終了：入力時間が勤務開始より前
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
  var recessIndex = getRecessIndexByTime(record,hour,minute);
  if(recessIndex < 0)return recessIndex;
  
  // 書込
  var time = parseElapsedTime(hour,minute);
  tcS.getRange(lastRow,recessIndex+2).setValue(time);
  return 0;
}

// 休憩終了
// @paran  :   date:日付   hour:時   minute:分
// @return :  0 正常終了
//         : -1 異常終了：不正な状態遷移
//         : -3 異常終了：入力時間が休憩開始より前
function endRecess(date,hour,minute){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  // 状態確認
  if(getState(record,lastRow)!="inRecess")return -1;
  Logger.log("endRecess");
  
  // 時間が適切か確認
  hour = hour -0+ (24 * findDiffOfDate(record[0][0],date));
  var recessIndex= getRecessIndexByTime(record,hour,minute);
  if(recessIndex < 0)return recessIndex;
  
  //書込
  var time = parseElapsedTime(hour,minute);
  tcS.getRange(lastRow,recessIndex+2).setValue(time);
  return 0;
}


// 退勤
// @return :  0 正常終了
//         : -1 異常終了：不正な状態遷移
//         : -2 異常終了：休憩回数上限超過
//         : -3 異常終了：入力時間が前回休憩より前
//         : -4 異常終了：入力時間が勤務開始より前
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
  var recessIndex= getRecessIndexByTime(record,hour,minute);
  if(recessIndex < 0)return recessIndex;
  
  // 書込
  var time = parseElapsedTime(hour,minute)
  tcS.getRange(lastRow,6).setValue(time);
  return 0;
}



// 状態を返す
// @param  : recode:最後のレコード   lastRow:最後の列の列番号　　
// @return : off       : 出勤前
//           inWork    : 勤務中
//           inRecess  : 休憩中
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
// @param  : hour:時 min:分
// @return : 経過時間 hh:mm:00.000
function parseElapsedTime(hour,min){
  return (hour+":"+(("00"+(min)).slice(-2))+":00.000");
}

// 入力時間は適切か確認
// @return : more than 1(次に休憩時間を書き込む場所を示す) 適切＝正常
//         : -3 異常：入力時間が前回休憩より前
//         : -4 異常：入力時間が勤務開始より前
function getRecessIndexByTime(record,hour,minute){
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

// 現在の状態など主要情報をHTMLに送る
// @return : result[0] 状態
//         : result[1] 場所
//         : result[2] 作業内容
//         : result[3] 直近打刻情報
function sendToHtml_state(){
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  var attribute = tcS.getRange(    2,2,1,14).getValues();
  
  // 状態確認
  var state =getState(record,lastRow);
  var result = Array(4);
  if(state=="inWork")  result[0] = "勤務中";
  if(state=="inRecess")result[0] = "休憩中";
  if(state=="off")     result[0] = "未出勤";
  if(lastRow>2){
    result[1]=record[0][1];
    result[2]=record[0][2];
    result[3]=loadPreRecodeTable(attribute,record,state);
  }
  Logger.log(result);
  return result;
}

// 直近打刻情報のHTML Tableを取得する
// @param  : attribute レコードの属性情報
//         : record    対象レコード
//         : state     現在の状態
// @return : 直近打刻情報を格納したtableのhtml
function loadPreRecodeTable(attribute,record,state){
  var recessIndex=6;
  if     (record[0][10])recessIndex=10
  else if(record[0][ 8])recessIndex= 8;
  
  var table ="<table onclick='if(!VARS.isFixing)initializeToSheetLink();'>";
  table += "<tr><td colspan='4'>直近打刻情報</td></tr><tr>";
  
  if(record[0][0])table+="<td>"+attribute[0][0]+"</td>";
  if(record[0][3])table+="<td>"+attribute[0][3]+"</td>";
  if(record[0][4])table+="<td>"+attribute[0][4]+"</td>";
  if(record[0][5])table+="<td>"+attribute[0][5]+"</td>";
  
  if(state!="off"){
    table +="<td>"+attribute[0][recessIndex  ]+"</td>";
    table +="<td>"+attribute[0][recessIndex+1]+"</td>";
  }
  
  table += "</tr><tr>";
  if(record[0][0])table +="<td>"+Utilities.formatDate(record[0][0],'JST','MM/dd')+"</td>";
  if(record[0][3])table +="<td>"+Utilities.formatDate(record[0][3],'JST','HH:mm')+"</td>";
  if(record[0][4])table +="<td>"+Utilities.formatDate(record[0][4],'JST','HH:mm')+"</td>";
  if(record[0][5])table +="<td>"+Utilities.formatDate(record[0][5],'JST','HH:mm')+"</td>";
  
  if(state!="off"){
    table +="<td>";
    if(record[0][recessIndex  ])table +=Utilities.formatDate(record[0][recessIndex  ],'JST','HH:mm');
    table +="</td><td>";
    if(record[0][recessIndex+1])table +=Utilities.formatDate(record[0][recessIndex+1],'JST','HH:mm');
    table +="</td>";
  }
  
  table += "</tr></table>"
  //Logger.log(table);
  return table;
}

// 最新打刻取消
function deleteLastData(){  
  var tcS     = nameOpen("timeCard");
  var lastRow = tcS.getLastRow();
  var record  = tcS.getRange(lastRow,2,1,14).getValues();
  
  var lastIndex = getLastIndex(record);  
  if(lastIndex<0)return -9;//error
  
  // 出勤打刻が最新のときは行ごと消す
  if(lastIndex==3){
    tcS.deleteRow(lastRow);
  }else{ //最新打刻を消す
    tcS.getRange(lastRow,2+lastIndex).setValue("");
  }
  
  return 0;
}

// 引数で与えられたrecordより，最後に入力された属性のindexを求める
// @param  record    レコード
// @return lastIndex 最後に入力された属性のindex
function getLastIndex(record){
  var indexList = [3,6,7,8,9,10,11,4];

  for(var i=(indexList.length-1);i>=0;i--){
    if(record[0][indexList[i]]!==""){
      return indexList[i];
    }
  }
  return -9; //error
}