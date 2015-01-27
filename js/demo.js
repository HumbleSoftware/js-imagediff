(function ($) {
  var
    CONTAINER = $('#demo'),
    TYPES = [
      {
        title : 'Normal',
        key : 'normal',
        a : 'images/1_normal_a.jpg',
        b : 'images/1_normal_b.jpg'
      },
      {
        title : 'Transparency',
        key : 'transparency',
        a : 'images/2_transparentPixels_a.png',
        b : 'images/2_transparentPixels_b.png'
      },
      {
        title : 'Size',
        key : 'size',
        a : 'images/4_differentSize_a.jpg',
        b : 'images/4_differentSize_b.jpg'
      },
      {
        title: 'Test',
        key: 'test',
        a: 'upload',
        b: 'upload'
      }
    ];

  jQuery.each(TYPES, function (index, type) {
    function dragover(e){
      e.preventDefault();
    }
    function drop(e){
      e.preventDefault();
      e.dataTransfer = e.originalEvent.dataTransfer;
      loadImage(e.dataTransfer.files[0]);
    }
    function loadImage(src){
      //	Prevent any non-image file type from being read.
      if(!src.type.match(/image.*/)){
        console.log("The dropped file is not an image: ", src.type);
        return;
      }

      //	Create our FileReader and run the results through the render function.
      var reader = new FileReader();
      reader.onload = function(e){
        render(e.target.result);
      };
      reader.readAsDataURL(src);
    }
    var count_rendered = 0;
    function render(result){
      // add it to the DOM
      node.append("<img class='dropped_img' src='" + result + "' />");
      count_rendered++;
      // increment the count
      drop_count.html(count_rendered + " dropped image(s)");
      if(count_rendered >= 2){
        var first_dropped_img = $(".dropped_img").get(0);
        var second_dropped_img = $(".dropped_img").get(1);
        // compare them
        var canvas = imagediff.createCanvas();
        // set the dimensions
        canvas.width = first_dropped_img.naturalWidth;
        canvas.height = first_dropped_img.naturalHeight;
        // add the css class
        canvas.className += " big_canvas";
        // center the canvas
        canvas.style.marginLeft = "-" + (canvas.width / 2 - 465) + "px";
        context = canvas.getContext('2d');
        c = imagediff.diff(first_dropped_img, second_dropped_img);
        context.putImageData(c, 0, 0);
        // give some info
        node.append("<p class='text_left clearfix result_title'>Result:</p>");
        // show the result
        node.append(canvas);
        // remove the dropbox
        dropbox.remove();
      }
    }
    if(type.key == "test"){

      var node = $(
        '<div class="example '+type.key+'">' +
        '<div class="title">'+type.title+':</div>' +
        '</div>'
      );

      CONTAINER.append(node);

      var dropbox = $('<div class="dropbox">Drop Images Here</div>');
      node.append(dropbox);
      var drop_count = $("<p id='drop_count'>0 dropped image(s)</p>");
      node.append(drop_count);

      // handle drop event
      console.log(dropbox);
      dropbox.bind('dragover', dragover);
      dropbox.bind('drop', drop);

    } else {
      var
        a       = new Image(),
        b       = new Image(),
        node    = $(
          '<div class="example '+type.key+'">' +
            '<div class="title">'+type.title+':</div>' +
          '</div>'),
        count   = 0,
        html    = '',
        canvas, context, c;

      CONTAINER.append(node);

      a.onload = b.onload = function () {
        count++;

        // Both images have loaded.
        if (count >= 2) {
          canvas = imagediff.createCanvas();
          canvas.width = 300;
          canvas.height = 300;
          context = canvas.getContext('2d');
          c = imagediff.diff(a, b);
          context.putImageData(c, 0, 0);
          node.append(canvas);
          $(canvas).wrap('<div class="image image-c"></div>');
          node.append(
            '<div class="labels">' +
              '<div class="label label-a">A</div>' +
              '<div class="separator">-</div>' +
              '<div class="label label-b">B</div>' +
              '<div class="separator">=</div>' +
              '<div class="label label-c">C</div>' +
            '</div>'
          );
        }
      };

      // only load the hrefs if they aren't to be uploaded
      a.src = type.a;
      b.src = type.b;


      node.append(a);
      $(a).wrap('<div class="image image-a"></div>');
      node.append(b);
      $(b).wrap('<div class="image image-b"></div>');

    }
  });

})(jQuery);
