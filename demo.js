(function ($) {
  var
    CONTAINER = $('#demo'),
    TYPES = [
      {
        title : 'Normal',
        a : 'https://github.com/cameronmcefee/Image-Diff-View-Modes/blob/8bf009f5e2aaf3c363d64d4e013527589c810b7e/1_normal.jpg?raw=true',
        b : 'https://github.com/cameronmcefee/Image-Diff-View-Modes/blob/8e95f70c9c47168305970e91021072673d7cdad8/1_normal.jpg?raw=true'
      },
      {
        title : 'Transparency',
        a : 'https://github.com/cameronmcefee/Image-Diff-View-Modes/blob/8bf009f5e2aaf3c363d64d4e013527589c810b7e/2_transparentPixels.png?raw=true',
        b : 'https://github.com/cameronmcefee/Image-Diff-View-Modes/blob/8e95f70c9c47168305970e91021072673d7cdad8/2_transparentPixels.png?raw=true'
      },
      {
        title : 'Size',
        a : 'https://github.com/cameronmcefee/Image-Diff-View-Modes/blob/8bf009f5e2aaf3c363d64d4e013527589c810b7e/4_differentSize.jpg?raw=true',
        b : 'https://github.com/cameronmcefee/Image-Diff-View-Modes/blob/8e95f70c9c47168305970e91021072673d7cdad8/4_differentSize.jpg?raw=true'
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
