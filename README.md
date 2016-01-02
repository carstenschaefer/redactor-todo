# redactor-todo
Redactor plugin for adding todo items

A plugin developed for [Redactor](http://imperavi.com/redactor/), a WYSIWYG rich-text editor made by [imperavi](http://imperavi.com/).

Feel free to contribute to this repository.

##Installation

Include todo.js and todo.css in your markup:

```html
<link href="todo.css" type="text/css" rel="stylesheet" />
<script src="autolist.js"></script>
```

##Usage
Configuration via javascript:

```javascript
$(function(){
  $("#editor").redactor({
    plugins: ['todoList']
  });
});
 ````
