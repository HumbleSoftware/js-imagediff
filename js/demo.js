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
      }
    ];

  jQuery.each(TYPES, function (index, type) {
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

    a.src = type.a;
    b.src = type.b;

    node.append(a);
    $(a).wrap('<div class="image image-a"></div>');
    node.append(b);
    $(b).wrap('<div class="image image-b"></div>');

  });

})(jQuery);
