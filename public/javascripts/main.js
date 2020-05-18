$(document).ready(function () {
    $(document).on("click", "#retrieve", function () {
        retrievePosts();
    });
});


function retrievePosts(){
    $.getJSON('/collection', function (data) {
        console.log(data);
    });
}
