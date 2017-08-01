define(function (require/*, exports, module*/) {
	"use strict";

	var EditorManager = brackets.getModule("editor/EditorManager"),
		CommandManager = brackets.getModule("command/CommandManager"),
		Menus = brackets.getModule("command/Menus"),
		Mustache = brackets.getModule("thirdparty/mustache/mustache"),
		AppInit = brackets.getModule("utils/AppInit"),
		Dialogs = brackets.getModule("widgets/Dialogs"),
		PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
		FileSystem = brackets.getModule("filesystem/FileSystem"),
		editorContextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

	var token;
	var editor;

	var preferencesID = "jzmstrjp.codic";
	var prefs = PreferencesManager.getExtensionPrefs(preferencesID);

	var SLDialog_tmp = require("text!dialog.html");
    var SLDialog;

	CommandManager.register("Codic (camelCase)", "jzmstrjp.codic.camel", function(){
		main("camel");
	});
	CommandManager.register("Codic (snake_case)", "jzmstrjp.codic.snake", function(){
		main("lower underscore");
	});

	function setFunctions(){
		editorContextMenu.addMenuDivider();
		editorContextMenu.addMenuItem("jzmstrjp.codic.camel", "Shift-Alt-C");
		editorContextMenu.addMenuDivider();
		editorContextMenu.addMenuItem("jzmstrjp.codic.snake", "Shift-Alt-S");
		editorContextMenu.addMenuDivider();
	}


	function init(){
		var pref_token = prefs.get("token");
		if(pref_token){
			token = pref_token;
			setFunctions();
		}else{
			openDialog();
		}
	}

	function openDialog() {
        var dl = Dialogs.showModalDialogUsingTemplate(Mustache.render(SLDialog_tmp));
        SLDialog = dl.getElement();
        //loadPrefs(SLDialog);
        SLDialog.on('click', '.dialog-button-save', function() {
            saveToken($('#codic_access_token', SLDialog).val());
        });
    		SLDialog.on('click', '#button', function() {
          FileSystem.showOpenDialog(false, true, null, null, null, function(str, arr) {
	            $('#location_path', SLDialog).val(arr);
	        });
        });
	}

	function saveToken(arg_token){
		token = arg_token;
		prefs.set("token", arg_token);
		setFunctions();
	}




	function main(case_name) {
		editor = EditorManager.getCurrentFullEditor();
		var selectTxts = editor.getSelectedText(true);
		var selectTxtArr = selectTxts.split("\n");
		//console.log(selectTxtArr);
		selectTxtArr.forEach(function(selectTxt, i){
			codic(selectTxt, case_name, i);
		});
	}

	function codic(ja, case_name, i) {
		$.ajax('https://api.codic.jp/v1/engine/translate.json', {
				type: 'get',
				data: {
					text: ja,
					casing: case_name,
					acronym_style: "MS naming guidelines",
				},
				headers: {
					'Authorization': "Bearer " + token
				}
			})
			// 検索成功時にはページに結果を反映
			.done(function (data) {
				replace(data[0].translated_text, i);
			})
			// 検索失敗時には、その旨をダイアログ表示
			.fail(function (data) {
				console.log(data);
			});
	}

	function replace(en, i) {
		var selection = editor.getSelections()[i];
		editor.document.replaceRange(en, selection.start, selection.end);
	}


	AppInit.appReady(function() {
       init();
    });
});