function getToday(){
  var now = new Date();
  now = Utilities.formatDate(now,'JST','yyyy/MM/dd');
  return now;
}
function getNow(){
  var now = new Date();
  now = Utilities.formatDate(now,'JST','yyyy/MM/dd HH:mm:ss');
  return now;
}

// date2-date1の日数を計算し，intで返す
function findDiffOfDate(date1,date2){
  date1 = new Date(date1).setHours(0);
  date2 = new Date(date2).setHours(0);
  return ((date2-date1)/86400000);
}

// 時間を比較する　基準time0に対してtime1が遅いか判定
// arg    : time0の時間と分　hour0,min0
// arg    : time1の時間と分　hour1,min1
// return : 0 : hour0;min0 のほうが大きいか等しい
// return : 1 : hour1;min1 のほうが大きい
function isLater(hour0,min0,hour1,min1){
  var time0=(hour0-0)*100+(min0-0);
  var time1=(hour1-0)*100+(min1-0);
  if(time0<time1)return 1;
  else           return 0;
  
}

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

function loadPreRecodeTable(attribute,record,state){
  var recessIndex=6;
  if     (record[0][10])recessIndex=10
  else if(record[0][ 8])recessIndex= 8;
  
  var table ="<br><table><tr><td colspan='4'>直近打刻情報</td></tr><tr>";
  
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


