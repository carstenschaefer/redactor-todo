if (!RedactorPlugins) var RedactorPlugins = {};

(function ($) {
    RedactorPlugins.todoList = function () {
        return {
            init: function(){
                var button = this.button.add('todoList', "Todo List");
                //button[0].innerHTML = "todo";
                
                this.button.addCallback(button, this.todoList.createList);
                
                this.opts.enterCallback = this.todoList.onEnterPress;
            },
            onEnterPress: function(e){
                // Get block in current caret position.
                var block = this.selection.getBlock();
                // Check if block was found.
                if(block === false){
                    // Block is not available. No need to continue.
                    return;
                }

                // Get jquery object of block.
                block = $(block);

                var parent;

                // Get the parent.
                if(block.hasClass("todo-item")){
                    parent = block.parent();
                }
                else{
                    parent = block.hasClass('todoList') ? block : block.closest('p.todoList');
                }

                if(parent.length > 0){
                    // Parent .todoList is available. Let's check if current list item is empty and it is a last child.
                    if(block.is(":last-child") && block.text().replace(/[\u200B-\u200D\uFEFF]/g, '').length === 0){
                        // It is empty and it should be removed.
                        block.remove();

                        // Redactor creates a new p tag after the parent automatically but it also copies the class of previous tag.
                        // i.e. p tag with .todoList. So we need to remove this class from newly created p tag. 
                        // However, the p tag appears after enterCallback completes, so wait for very small period of time 
                        // before we remove .todoList from it.
                        setTimeout(this.todoList.removeCurrentClass, 5)

                        return;
                    }
                    else if(/firefox/gi.test(navigator.userAgent)){
                        // Bad, bad Firefox. When a new item is added, it keeps event handler in new .todo-item,
                        // but somehow it removes that event handler on previous as well. So this is alternative for FF.

                        // Prevent default behaviour of enter event.
                        e.preventDefault();

                        this.todoList.ffEnterPress(e);

                        return;
                    }

                    // Upto this point, there is no need to do anything as redactor creates a new item,
                    // i.e. p tag with .todo-item class, automatically. It means our item is created without our intervention
                    // but we still need to bind click event of item. But since the item is added until enterCallback isn't complete,
                    // so we wait for very short period before binding.
                    // For Firefox bug resolultion, check "else if" above.
                    setTimeout(this.todoList.bindTodoClick, 2);
                }
            },
            ffEnterPress: function(e){
                // This method resolves bug in firefox.
                
                // Get current block. It must be .todo-item.
                var block = $(this.selection.getBlock());
                if(block && block.hasClass('todo-item')){
                    // Create new item for next line and bind click event handler.
                    var newItem = $("<p class='todo-item todo-checkbox' />").click(this.todoList.toggleTodoCheck);
                    
                    // If caret is already at the end of block when user presses enter, we need to create an empty .todo-item.
                    // But user may place the caret between the text. So we need to place text starting from caret position
                    // upto the end of block in new .todo-item.
                    // So create two markers to select the content between them. The selection starts from current caret position
                    // upto the end of current block.
                    var marker1 = this.selection.getMarker(1);
                    var marker2 = this.selection.getMarker(2);
                    
                    // Add the marker at caret position.
                    this.insert.node(marker1);
                    
                    // Add the marker at the end of block.
                    block.append(marker2);
                    
                    // Select the content between those markers. Once the selection occurs, the markers are automatically removed.
                    this.selection.restore();
                    
                    // Now get html available in selection.
                    var html = this.selection.getHtml();
                    
                    if(html.length > 0){
                        // html is not empty. So copy that html to new .todo-item.
                        newItem.html(html);
                        
                        // And clear the content of selection.
                        this.insert.text("");
                    }
                    
                    // Add this new .todo-item after current block.
                    block.after(newItem);
                    
                    // Now we need to set the caret at the start of new .todo-item.
                    // So create another marker.
                    marker1 = this.selection.getMarker();
                    
                    // Place this marker at the start of new .todo-item.
                    newItem.prepend(marker1);
                    
                    // And restore the position at marker. It automatically removes the marker as well.
                    this.selection.restore();
                }
            },
            removeCurrentClass: function(){
                $(this.selection.getBlock()).removeClass("todoList");
            },
            bindTodoClick: function(){
                var node = $(this.selection.getBlock());
                
                if(!node.hasClass("todo-item")){
                    node = node.closest("p.todo-item");
                }

                node.click(this.todoList.toggleTodoCheck);
                var events = $._data(node.get(0), "events").click;
                if(events.length > 0) return;
                
                if(node.hasClass("todo-checkmark")){
                    node.removeClass("todo-checkmark").addClass("todo-checkbox");
                }
                
                node.parent().children("br").remove();
            },
            createList: function(){
                
                if(!this.sel){
                    // Current there is no focus in redactor. Set it.
                    this.focus.setEnd();
                }
                
                var offset = null;
                
                var block = $(this.selection.getBlock());
                if(block.length > 0 && block.hasClass("todo-item")){
                    // Preserve offset of caret.
                    offset = this.caret.getOffset();
                    
                    // Here a block is confirmed child node of .todoList.
                    // User is toggling todo icon. So make sure that the current list item is removed and placed properly.
                    
                    // Gets a parent object; i.e. .todoList.
                    var parent = block.parent();
                    
                    // Get index of current item in list.
                    var index = block.index();
                    
                    // Number of items in .todoList.
                    var length = parent.children().length;
                    
                    // Remove current list item along with all association with .todoList.
                    block.removeClass("todo-item todo-checkbox todo-checkmark").remove();
                    
                    if(length === 1){
                        // The current item is sole item. Simply remove .todoList from parent and 
                        // copy content of removed item into the tag.
                        parent.removeClass("todoList").html(block.html());
                    }
                    else if(index === 0){
                        // Block used to be first item in list. Simply put it before .todoList.
                        parent.before(block);
                    }
                    else if(index === length - 1){
                        // Block used to be last item in list. Simply put it after .todoList.
                        parent.after(block);
                    }
                    else{
                        // Block used to be listed between items.
                        // Get list of items starting from the position of removed block.
                        var items = parent.children(":gt(" + (index - 1) + ")");
                        
                        // Remove those items. It ends .todoList here.
                        items.remove();
                        
                        // Now put the block after .todoList.
                        parent.after(block);
                        
                        // Create a new .todoList and add items from previous list in it.
                        block.after($("<p class='todoList'></p>").append(items));
                        
                        // Newly added .todo-item list does not keep click handler. So reassign that.
                        items.click(this.todoList.toggleTodoCheck);
                    }
                    
                    this.caret.setOffset(offset);
                    offset = null;
                    
                    // No need to continue.
                    return;
                }
                
                
                var content = "";
                if(block.length === 0){
                    // Block could be empty or redactor does not have anything, not even p tag.
                    // But still make sure that it is empty. So...
                    if(this.sel.focusNode.id && this.$editor[0].id === this.sel.focusNode.id){
                        // Focus node is reaching redactor element. So create this 
                        block = $("<p class='todoList' />");
                        // Add this block in redactor.
                        this.$editor.append(block);
                        
                        block.after("<p></p>");
                    }
                    else{
                        // Glitch. Redactor is not reading the block, i.e. empty p tag, inside it while using getBlock() method.
                        // this.focus.setEnd() sets the focus but somehow the getBlock() call returns false.
                        // So get current node. If it is text, then get its parent node. This parent must be p tag.
                        block = $(this.sel.focusNode.nodeType === 3 ? this.sel.focusNode.parentNode : this.sel.focusNode);
                        
                        // Make this block a todoList.
                        block.addClass("todoList");
                        
                        // Make block empty.
                        block.html("");
                    }
                }
                else if(block[0].nodeName.toLowerCase() === "p"){
                    // It means current block is p tag. Make it a root of todoList.
                    block.addClass("todoList");
                    
                    // Sometimes redactor adds br tag in blocks when it is empty. It moves caret before .todo-item.
                    // So remove all br tags.
                    block.children("br").remove();
                    
                    // Now since all br tags are removed, the block could be empty.
                    content = block.html();
                    
                    if(content.length !== 0){
                        // If block is still not empty, preserve caret's offset.
                        offset = this.caret.getOffset();
                    }
                    
                    block.html("");
                }
                else{
                    // block could be anything. It could be li, or td. 
                    // If block is li, return.
                    // 
                    // TODO: What to do if block is li???
                    if(block[0].nodeName.toLowerCase() === "li")
                        return;
                    
                    content = block.html();
                    
                    // Create .todoList.
                    var p = $("<p class='todoList' />");
                    
                    // Add .todoList in block.
                    block.html(p);
                    
                    // Get p as a block for further execution.
                    block = p;
                }
                
                // Create a list item.
                var item = $("<p class='todo-item todo-checkbox' />").click(this.todoList.toggleTodoCheck);
                
                item.html(content);
                
                if(offset != null){
                    // It means caret offset is preserved.
                    
                    // Add .todo-item in block.
                    block.html(item);
                    
                    // Move the caret to preserved offset.
                    this.caret.setOffset(offset);
                }
                else{
                    // Here initial content is possibly empty.
                    // Setting offset in empty content lead to irregular behaviour.
                    // Redactor allows to create a marker, and append it in element.
                    // So get the marker.
                    var marker = this.selection.getMarker();
                    
                    // Append it in element;
                    item.append(marker);

                    // Add item in block.
                    block.html(item);

                    // Inform redactor to restore caret position at given marker.
                    // Once caret position is restored, the marker is also removed.
                    this.selection.restore();
                }
                
                // Redactor may set br tag somewhere in the list. Remove it.
                block.children("br").remove();
                item.children("br").remove();
                
                offset = null;
            },
            toggleTodoCheck: function(e){
                var block = $(e.target);
                
                var offset = e.offsetX === undefined ? e.pageX - block.offset().left : e.offsetX;
                
                if(offset > 18) return;
                
                if(!block.hasClass("todo-item")){
                    block = block.closest("p.todo-item");
                }
                
                if(!block.hasClass('todo-checkmark') && !block.hasClass('todo-checkbox')) return;
                
                if(block.hasClass('todo-checkmark')){
                    block.removeClass("todo-checkmark").addClass("todo-checkbox");
                }
                else{
                    block.addClass("todo-checkmark").removeClass("todo-checkbox");
                }
                
                // Get the marker.
                var marker = this.selection.getMarker();

                // Append it in element;
                block.append(marker);

                // Inform redactor to restore caret position at given marker.
                // Once caret position is restored, the marker is also removed.
                this.selection.restore();
            }
        };
    };
})(jQuery);
