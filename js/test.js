describe('ImageTest', function() {

  // Matchers
  beforeEach(function () {
    this.addMatchers(imagediff.jasmine);
  });

  // Test
  it('should convert be the same image', function () {

    var
      a = new Image(),
      b = new Image();
    a.src = 'images/1_normal_a.jpg';
    b.src = 'images/1_normal_a.jpg';

    waitsFor(function () {
      return a.complete & b.complete;
    }, 'image not loaded.', 2000);

    runs(function () {
      expect(a).toImageDiffEqual(b);
    });
  });

  it('should convert be the same image', function () {

    var
      a = new Image(),
      b = new Image();
    a.src = 'images/1_normal_a.jpg';
    b.src = 'images/1_normal_b.jpg';

    waitsFor(function () {
      return a.complete & b.complete;
    }, 'image not loaded.', 2000);

    runs(function () {
      expect(a).toImageDiffEqual(b);
    });
  });
});
