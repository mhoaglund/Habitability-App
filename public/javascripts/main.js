var token = undefined;
var reachedEnd = false;
var debouncing = false;
var docheight = $(document).height() -5;
$(document).ready(function () {
    $(document).on("click", "#retrieve", function () {
        retrievePosts();
    });

    $(document).on("click", '.flip-container .flipper', function () {
        $(this).closest('.flip-container').toggleClass('hover');
        $(this).css('transform, rotateY(180deg)');
    });

    $(document).on('scroll', function () {
        if ($(window).scrollTop() + $(window).height() >= docheight) {
            if(!debouncing){
                console.log("bottom!");
                if (!reachedEnd){
                    retrievePosts();
                }
            }
        }
    })

    $('#intakeform').submit(function (e) {
        e.preventDefault();
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
            },
            error: function(e){
                console.log(e);
            }
        })
    });
});



function retrievePosts(){
    $("#spinner").css({'display': 'flex'});
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

