// test for @capture existence
function supported(attribute) {
    var i = document.createElement('input');
    i.setAttribute(attribute, true);
    return !!i[attribute];
  }
  
  document.querySelector('#supported').innerHTML =
    'It appears <strong>@capture is ' + (supported('capture') ? 'supported' : 'not supported') +
    '</strong> and <strong>@accept is ' + (supported('accept') ? 'supported' : 'not supported') + '</strong>.';

  var input = document.querySelector('#example4');
  
  input.onchange = function () {
    var file = input.files[0];
    
    // upload(file);
    drawOnCanvas(file);
    displayAsImage(file);
  };
  
  function upload(file) {
    var form = new FormData(),
        xhr = new XMLHttpRequest();
    
    form.append('image', file);
    xhr.open('post', 'server.php', true);
    xhr.send(form);
  }
  
  function drawOnCanvas(file) {
    var reader = new FileReader(),
    c = document.createElement('canvas');
    document.body.appendChild(c);
  
    reader.onload = function (e) {
      var dataURL = e.target.result,
          c = document.querySelector('canvas'),
          ctx = c.getContext('2d'),
          img = new Image();
          
      img.onload = function() {
        c.width = img.width;
        c.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      
      img.src = dataURL;
    };
    
    reader.readAsDataURL(file);
  }
  
  function displayAsImage(file) {
    var imgURL = URL.createObjectURL(file),
        img = document.createElement('img');
    
    img.onload = function() {
      URL.revokeObjectURL(imgURL);
    };
    
    img.src = imgURL;
    document.body.appendChild(img);
  }
  
  