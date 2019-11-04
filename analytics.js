var Analytics = {
	
	domain: "http://zhenik.bget.ru", // домен со скриптами и стилями
	classCurElement: "red-test", // класс, для подсветки блока
	classSetElement: "green-test", // класс, для заданного блока
	currentElement: false, // активный элемент на странице
	countGoal: 0, // количество целей
	
	
	// инициализация скрипта
	init: function(){
		if(!window.jQuery){
			// подключение jQuery, если его нет 
			var jQscript = document.createElement('script');
			jQscript.src = Analytics.domain+'/jquery-3.3.1.js';
			document.head.appendChild(jQscript);			
			jQscript.onload = function() {
				Analytics.start();
			};			
		}else{
			Analytics.start();			
		}
    },	
	
	// старт скрипта
	start: function(){
		// подключение стилей
		var cssStyle = document.createElement('link');
		cssStyle.rel = "stylesheet";
		// cssStyle.href = Analytics.domain+'/analytics.css';
		cssStyle.href = 'analytics.css';
		document.head.appendChild(cssStyle);	
		
		// добавление верстки
		Analytics.addHTML(); 
		
		// служебные события 
		Analytics.methodSettings();
		
		// отлов кликов по элементам		
		Analytics.listen();
		
	},
	
	// отлов клика
	listen: function(){
		$('body').click(function (event) {
			var element = $(event.target);	
						
			// если служебный блок, то игнорируем
			if(element.closest(".analytics-element").length > 0){
				return false;
			}
			
			// если клик по уже активному блоку, то попап прячется
			if(element.hasClass(Analytics.classCurElement)){
				$(".analytics-popup").hide();
				element.removeClass(Analytics.classCurElement);
				Analytics.currentElement = false; 
				return false;
			}
				
			//  получение уникального селектора
			var uniqSelector = Analytics.detectSelector(element);		
			// console.log(uniqSelector);
			
			// открыть окно настройки цели
			Analytics.popupSetting(element, uniqSelector);
			
		});
	},	
	
	// служебные события 
	methodSettings: function(){
		// сохранить цель
		$('body').on('click', '#analytics-save', function() {
			// валидация перед сохранением
			if(Analytics.validateGoal()){
				Analytics.saveGoal();				
			}
		});
		
		// удалить цель
		$('body').on('click', '#analytics-del', function() {
			if(Analytics.currentElement.hasClass(Analytics.classSetElement)){
				Analytics.deleteGoal();				
			}
		});
	},
	
	// валидация цели перед сохранением
	validateGoal: function(){
		// @toDo
		return true;
	},

	// сохранение цели
	saveGoal: function(){
		$.ajax({
			type: "POST",
			url: Analytics.domain+'/ajax.php',
			data:{
				"method": "save",
				"selector-goal": $("#analytics-selector-goal").val(),
				"name-goal": $("#analytics-name-goal").val(),
				"id-goal": $("#analytics-id-goal").val(),
			},
			success: function(){
				// добавление в список
				// @toDo проверка на редактирование старых целей
				if(Analytics.countGoal > 0){
					$(".analytics-main-container ul").append(' \
						<li data-id-goal="'+$("#analytics-id-goal").val()+'">'+$("#analytics-name-goal").val()+'</li> \
					');					
				}else{
					$(".analytics-main-container ul").html(' \
						<li data-id-goal="'+$("#analytics-id-goal").val()+'">'+$("#analytics-name-goal").val()+'</li> \
					');
				}
				
				$(".analytics-popup").hide();
				Analytics.currentElement.addClass(Analytics.classSetElement);
				Analytics.currentElement.data("selector-goal", $("#analytics-selector-goal").val());
				Analytics.currentElement.data("name-goal", $("#analytics-name-goal").val());
				Analytics.currentElement.data("id-goal", $("#analytics-id-goal").val());
				Analytics.countGoal++; // @toDo проверка на редактирование старых целей, чтобы лишнее не считал
				Analytics.currentElement.removeClass(Analytics.classCurElement);
				
				
			}
		});
	},
	
	// удаление цели
	deleteGoal: function(){		
		$.ajax({
			type: "POST",
			url: Analytics.domain+'/ajax.php',
			data:{
				"method": "delete",
				"id-goal": $("#analytics-id-goal").val(),
			},
			success: function(){
				// удаление из списка
				if(Analytics.countGoal > 1){
					$(".analytics-main-container ul li[data-id-goal='"+$("#analytics-id-goal").val()+"']").remove();
				}else{
					$(".analytics-main-container ul").html('<li>Пока нет</li>');
				}
				
				$(".analytics-popup").hide();
				Analytics.currentElement.removeClass(Analytics.classSetElement);
				Analytics.currentElement.data("selector-goal", "");
				Analytics.currentElement.data("name-goal", "");
				Analytics.currentElement.data("id-goal", "");
				Analytics.countGoal--;
			}
		});
	},
	
	// раскрытие окна настройки цели
	popupSetting: function(element, uniqSelector){
		if(element.hasClass(Analytics.classSetElement)){
			// если элементу уже задана цель
			$("#analytics-selector-goal").val(element.data("selector-goal"));
			$("#analytics-id-goal").val(element.data("id-goal"));
			$("#analytics-name-goal").val(element.data("name-goal"));
		}else{
			// если новый элемент
			$("#analytics-selector-goal").val(uniqSelector);
			var uniqId = Analytics.getUniqIdentification();
			$("#analytics-id-goal").val(uniqId);
			$("#analytics-name-goal").val("Цель " + (Analytics.countGoal + 1));
		}
		// подсветка элемента
		element.addClass(Analytics.classCurElement);
		// координаты и высота элемента
		var offsetEl = element.offset(),
			heightEl = element.height();
			
		$(".analytics-popup").show();
		$(".analytics-popup").css({
			"top": offsetEl.top + heightEl,
			"left": offsetEl.left
		});
		
		// активный элемент
		if(Analytics.currentElement){
			Analytics.currentElement.removeClass(Analytics.classCurElement);
		}
		Analytics.currentElement = element; 
	},
	
	// определение уникального селектора
	detectSelector: function(element){
		// если есть уникальный id
		if(Analytics.getUniqId(element)){
			return Analytics.getUniqId(element);
		}
		// если есть уникальный набор классов или класс
		if(Analytics.getUniqClass(element)){
			return Analytics.getUniqClass(element);
		}
		// определение порядкового номера элемента
		if(Analytics.getUniqNumber(element)){
			return Analytics.getUniqNumber(element);
		}
				
		return false; 
	},
	
	// получение уникального ID, если есть
	getUniqId: function(element){
		if(typeof element.attr("id") != 'undefined' ){
			// если уникальный селектор
			// if($(event.target.localName + "#"+element.attr("id")).length == 1){
			if(document.querySelectorAll(event.target.localName + "#"+element.attr("id")).length == 1){
				return event.target.localName + "#"+element.attr("id");
			}				
		}
		return false; 
	},
	
	// получение уникального class, если есть
	getUniqClass: function(element){
		if(typeof element.attr("class") != 'undefined' ){
			var all_classes = element.attr("class");
			all_classes = all_classes.replace(/\s+/g, " "); // удаление дублей пробелов
			var str_classes = all_classes.split(' ').join('.');
			
			// если уникальный селектор
			// console.log(event.target.localName + "." + str_classes);
			if($(event.target.localName + "." + str_classes).length == 1){
				return event.target.localName + "." + str_classes;
			}		
		}
		return false; 
	},
	
	// получение порядкового номера элемента
	getUniqNumber: function(element){
		var tagName = event.target.localName;
		var className = "";
		if(typeof element.attr("class") != 'undefined' ){
			var all_classes = element.attr("class");
			all_classes = all_classes.replace(/\s+/g, " "); // удаление дублей пробелов
			className = "." + all_classes.split(' ').join('.');
		}
		var uniqNum = false;
		$(tagName+className).each(function(index_element){
			// console.log($(this), element)
			if($(this)[0] == element[0]){
				uniqNum = tagName+className+":eq("+index_element+")";
				return false;
			}
		});		
		return uniqNum; 
	},
	
	// генератор уникального id для имени цели
	getUniqIdentification: function(){
		var len = 8;
		var id = "";
		var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (var i = 0; i < len; i++){
			id += symbols.charAt(Math.floor(Math.random() * symbols.length));     
		}
		return "GOAL_" + id;
	},
	
	// добавление на страницу HTML-блоков
	addHTML: function(element){
		$('body').append(' \
			<div class="analytics-element analytics-main-panel"> \
				<label class="analytics-title">Analytics panel</label> \
				<p class="analytics-description"> \
					<b style="color:red">Режим редактирования метрики</b><br><br> \
					Для добавления цели, кликните по нужному элементу на странице \
				</p> \
				<b style="color:red">Добавленные цели:</b> \
				<div class="analytics-main-container"> \
					<ul> \
						<li>Пока нет</li> \
					</ul> \
				</div> \
			</div> \
			<div class="analytics-element analytics-popup"> \
				<input type="text" id="analytics-selector-goal" value="" placeholder="селектор цели"><br><br> \
				<input type="text" id="analytics-name-goal" value="" placeholder="название цели"><br><br> \
				<input type="text" id="analytics-id-goal" value="" placeholder="идентификатор цели"><br><br> \
				<input type="button" id="analytics-save" value="Сохранить"><br><br> \
				<input type="button" id="analytics-del" value="Удалить"><br><br> \
			</div> \
		');
	},
	
}

