'use strict';

function Manifest(path) {
	var f = new FileCache(path + air.File.separator + 'manifest');
	var data = f.val ? JSON.parse(f.val) : [];
	this.file = f;

	this.tbl = $('\
		<table>                                  \
			<thead>                              \
				<tr>                             \
					<th>Type</th>                \
					<th class="big">Title</th>   \
					<th class="big">Status</th>  \
					<th>Remove</th>              \
				</tr>                            \
			</thead>                             \
			<tbody class="proj">                 \
			</tbody>                             \
		</table>');
	this.confirm = $('\
		<div id="dialog-confirm" style="display: none" title="Delete Content"> \
			<p>This content will be permanently deleted and cannot be          \
			recovered. Are you sure?</p>                                       \
		</div>');
	this.edit = $(
		'<div id="dialog-content" style="display: none" title="Edit Content"></div>'
	);

	for(var i in data) {
		var content = Content.FromMetadata(path, data[i]);
		this.addContent(content);
	}
}

Manifest.prototype.render = function(div) {
	div.append(this.tbl);
	var manifest = this;
	this.tbl.find('tbody').sortable({
		items: 'tr', axis: 'y',
        update: function(event, ui) { manifest.save(); }
	});
};

Manifest.prototype.save = function() {
	var ar = [];
	this.tbl.find('tr').each(function(k, v) {
		if($(v).data('content')) {
			ar.push($(v).data('content').metadata());
		}
	});
	this.file.val = JSON.stringify(ar);
	this.file.flush();
};

Manifest.prototype.addContent = function(content) {
	var tr = $('<tr />');
	this.tbl.find('tbody').append(tr);
	tr.append($('<td class="icon"><img src="' + content.icon + '"/></td>'));
	tr.append($('<td><a href="#">' + content.title + '</a></td>'));
	tr.append($('<td>Unpublished</td>'));
	tr.append($('<td class="icon"><img class="remove" src="icons/remove.png" alt="Remove Item" /></td>'));
	tr.data('content', content);

	var manifest = this;

	tr.find('img.remove').click(function() {
		manifest.confirm.dialog({
			height:240,
			modal: true,
			buttons: {
				"Delete Content": function() {
					tr.data('content').deleteFile();
					tr.remove();
					manifest.save();
					$( this ).dialog( "close" );
				},
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});
	});
	tr.find('a').click(function() {
		var c = tr.data('content');
		manifest.edit.empty();
		if(c.render(manifest.edit)) {
			manifest.edit.dialog({
				autoOpen: true,
				modal: true,
				width: 540,
				position: 'top',
				beforeClose: c.unrender,
				buttons: {
					"Save": function() { 
						c.save();
						tr.find('a').text(c.title);
						tr.data('content', c);
						manifest.save();
						$(this).dialog("close"); 
					} 
				}
			});
			manifest.edit.find('textarea').cleditor({
				controls: "bold italic underline bullets numbering alignleft " +
						  "center alignright justify undo redo cut copy paste"});
		}
		return false;
	});
	this.save();
};

