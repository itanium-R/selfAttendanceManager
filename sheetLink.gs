function sendToHtml_sheetOpenButton(){
  var timeCardSht     = nameOpen("timeCard");
  var linkHtml="";
  
  linkHtml += '<input type="button" value="シートを開く" onclick="';
  linkHtml += "window.open('";
  linkHtml += builtSpreadSheetUrl(timeCardSht);
  linkHtml +=  "')"+'"><br>';

  return linkHtml;
}

function sendToHtml_pdfDlButton(year,month){
  var monthRepSht     = nameOpen("monthRep");
  var linkHtml="";
  
  monthRepSht.getRange("F2").setValue(year);
  monthRepSht.getRange("H2").setValue(month);
  
  linkHtml += '<input type="button" value="'+year+'/'+month+' 月報DL" onclick="';
  linkHtml += "window.open('";
  linkHtml += builtPdfDownloadUrl(monthRepSht);
  linkHtml +=  "')"+'"><br>';
  
  Logger.log(linkHtml);
  return linkHtml;
}

function monthRep(){
  var monthRep     = nameOpen("monthRep");
  
  Logger.log(builtPdfDownloadUrl(monthRep));
}

function builtSpreadSheetUrl(sheet){  
  var SSid = SpreadsheetApp.getActiveSpreadsheet().getId();//アクティブスプレッドシートのID取得
  var sheetId = sheet.getSheetId();                        //月次決算シートのID取得
  var url="https://docs.google.com/spreadsheets/d/" + SSid + "/edit#gid=" + sheetId + "";
  return url;
}

function builtPdfDownloadUrl(sheet){  
  var SSid = SpreadsheetApp.getActiveSpreadsheet().getId();//アクティブスプレッドシートのID取得
  var sheetId = sheet.getSheetId();                        //月次決算シートのID取得
  var url="https://docs.google.com/spreadsheets/d/" + SSid + "/export?format=pdf&gid=" + sheetId + "";
  return url;
}