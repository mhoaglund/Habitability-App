var token = undefined;

$(document).ready(function () {
    $(document).on("click", "#retrieve", function () {
        retrievePosts();
    });

    $(document).on("click", '.flip-container .flipper', function () {
        $(this).closest('.flip-container').toggleClass('hover');
        $(this).css('transform, rotateY(180deg)');
    });
});

function retrievePosts(){
    //TODO loading spinner
    // $.get("/collection", function (data, xhr) {
    //     alert(xhr.getResponseHeader("Continuation-Token"));
    //     $("#output").append(data);
    // });
    var posts = $.ajax({
        type: 'GET',
        url: '/collection',
        data: (token) ? token : null,
        dataType: 'html'
    });
    posts.done(function (data, textStatus, jqXHR) {
        //console.log(jqXHR);
        alert(jqXHR.getResponseHeader("Continuation-Token"));
        token = $.parseJSON(jqXHR.getResponseHeader("Continuation-Token"));
        console.log(token.nextRowKey);
        $("#output").append(data);
    })
}

