var token = undefined;
var myrowkey = undefined;
var reachedEnd = false;
var debouncing = false;
var shouldShowOwn = false;
var hasSubmitted = false;
var docheight = $(document).height() -5;
$(document).ready(function () {
    $('.own_post').hide();
    $(document).on("click", "#retrieve", function () {
        retrievePosts();
    });

    $(document).on("click", '.flip-container .flipper', function () {
        $(this).closest('.flip-container').toggleClass('hover');
        $(this).css('transform, rotateY(180deg)');
    });

    $(document).on("click", '#notes', function () {
        $(this).closest('.flip-container').toggleClass('hover');
        $('.patchnotes').toggleClass('hidden');
    });


    $(document).on('scroll', function () {
        if ($(window).scrollTop() + $(window).height() >= docheight) {
            if(!debouncing){
                if (!reachedEnd && hasSubmitted) {
                    retrievePosts();
                }
            }
        }
    })

    $('#intakeform').submit(function (e) {
        e.preventDefault();
        $('#submitall').prop("disabled", true);
        $('#intakeform').css({'opacity':'0.5'});
        $("#spinner").css({
            'display': 'flex'
        });
        var form = $('#intakeform')[0];
        var data = new FormData(form);
        $.ajax({
            type: "POST",
            enctype: "multipart/form-data",
            url: "/collection",
            data: data,
            processData: false,
            contentType: false,
            cache: false,
            timeout: 60000,
            success: function(reply){
                console.log(reply);
                if (reply.oall === 'Success') {
                    alert('Submission complete!');
                    document.getElementById("intakeform").reset();
                    if (reply.myrowkey){
                        //If we created a row, create a rule to hide it if it comes back from the server.
                        //We're creating the realtime experience by showing the user's images in the feed.
                        myrowkey = reply.myrowkey;
                        $('own_post').attr('id', myrowkey);
                        hasSubmitted = true;
                        $("<style type='text/css'> #" + myrowkey + "{ display: none;} </style>").appendTo("head");
                    }
                }
                $("#spinner").css({
                    'display': 'none'
                });
            },
            error: function(e){
                console.log(e);
                $("#spinner").css({
                    'display': 'none'
                });
            }
        })
    });
});

var loadFile = function (event) {
    if(!shouldShowOwn){
        shouldShowOwn = true;
        $('.own_post').show();
    }
    var show_element = '#' + event.target.id + '_output';
    var imgurl = URL.createObjectURL(event.target.files[0])
    $(show_element).css({
        'background-image':'url('+imgurl+')'
    })
};

function retrievePosts(){
    $("#spinner").css({'display': 'flex'});
    $('.own_post').hide();
    debouncing = true;
    var posts = $.ajax({
        type: 'GET',
        url: '/collection',
        data: (token) ? token : null,
        dataType: 'html'
    });
    posts.done(function (data, textStatus, jqXHR) {
        if (jqXHR.getResponseHeader("Continuation-Token")){
            token = $.parseJSON(jqXHR.getResponseHeader("Continuation-Token"));
        } else {
            reachedEnd = true;
            console.log("Reached end of posts.");
        }
        $("#output").append(data);
    });
    posts.always(function(){
        $("#spinner").css({
            'display': 'none'
        });
        debouncing = false;
        docheight = $(document).height() - 5;
    })
}

