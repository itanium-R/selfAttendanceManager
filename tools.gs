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

//------------------------------------------------------------

//アクティブスプレッドシートのnameシートを開く函数
function nameOpen(name){
  try{
    const ss = SpreadsheetApp.getActiveSpreadsheet(); //アクティブスプレッドシートを開く->ss
    const sss = ss.getSheetByName(name);              //nameという名前のシートを開く->sss
    return sss;
  }catch(e){                                          //エラー発生時は表示
    Browser.msgBox("シートを開けませんでした" + e);
  }
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
//------------------------------------------------------------

//アクティブスプレッドシートのnameシートを開く函数
function openUsersSheetByName(name){
  try{
    const ss = SpreadsheetApp.getActiveSpreadsheet();   //アクティブスプレッドシートを開く->ss
    const shtName = getUserName()+"-"+name;
    if(isSheetExist(shtName)){
      return ss.getSheetByName(shtName);   // 見つかったシートを開く
    }else{
      return createUsersShtFromTmpl(name); // シートがないときは作成する
    }
  }catch(e){  
    //Logger.log(e);
    return -1;
  }
}


//------------------------------------------------------------


function getUserName(){
  try{
    var userName = Session.getActiveUser().getEmail().split('@')[0];
    //Logger.log(userName);
    return userName;
  }catch(e){
    //Logger.log(e);
    return -1;
  }
}


function isSheetExist(shtName){
  const ss =SpreadsheetApp.getActiveSpreadsheet();
  const sheetCnt = ss.getNumSheets();
  var sheet;
  for(var i=0;i<sheetCnt;i++){
    sheet = ss.getSheets()[i];
    if(ss.getSheets()[i].getName()==shtName){
      return true;
    }
  }
  return false;
}

function createUsersShtFromTmpl(tmplName){
  const userName = getUserName();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tmplSht  = nameOpen(tmplName);
  const usersSht = tmplSht.copyTo(ss);
  usersSht.setName(userName+"-"+tmplName);
  return usersSht;
}

function test66(){
  Logger.log(openUsersSheetByName("timeCard").getName());
}