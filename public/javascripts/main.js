var token = undefined;
var myrowkey = undefined;
var reachedEnd = false;
var debouncing = false;
var shouldShowOwn = false;
var hasSubmitted = false;
var docheight = $(document).height() -400;
var showSubmit = false;

$(document).ready(function () {
    $('.own_post').hide();
    $(document).on("click", "#retrieve", function () {
        retrievePosts();
    });

    $(document).on("click", '.flip-container.post .flipper, .own_post .flip-container .flipper', function () {
        $(this).closest('.flip-container').toggleClass('hover');
        $(this).css('transform, rotateY(180deg)');
    });

    $(document).on("click", '#notes', function () {
        $(this).closest('.flip-container').toggleClass('hover');
        $('.patchnotes').toggleClass('hidden');
    });

    $(document).on("click", '.flow-btn, .exit-btn', function () {
        var senderid = $(this).attr('id').split('-')[1];
        var targetid = '#' + senderid + '-formelement';
        toggleFormElement(targetid);
        if ($(this).attr('id').split('-')[0] === 'end'){
            //resetForm(senderid, true);
            //formStepOne(senderid);
        }
        if ($(this).attr('id').split('-')[0] === 'start') {
            formStepOne(senderid);
        }
    });

    $(document).on("click", '.next', function () {
        var senderid = $(this).attr('id').split('-')[0];
        formStepThree(senderid);
    });

    $(document).on("click", '#skip', function () {
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#see").offset().top
        }, 1000);
    });

    $(document).on("click", '.ok', function () {
        var senderid = $(this).attr('id').split('-')[0];
        completeForm(senderid);
    });

    $(document).on('scroll', function () {
        if ($(window).scrollTop() + $(window).height() >= docheight) {
            if(!debouncing){
                if (!reachedEnd && hasSubmitted) {
                    retrievePosts();
                    deactivateForm();
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
                    
                    if (reply.myrowkey){
                        //If we created a row, create a rule to hide it if it comes back from the server.
                        //We're creating the realtime experience by showing the user's images in the feed on the client.
                        myrowkey = reply.myrowkey;
                        hasSubmitted = true;
                        $("<style type='text/css'> [id='" + myrowkey + "'] { display: none;} </style>").appendTo("head");
                        
                    }
                    retrievePosts();
                }
                displayOwnPost();
                document.getElementById("intakeform").reset();
                deactivateForm();
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

function deactivateForm(){
    $('form input, form a').hide();
    resetForm('first', true);
    resetForm('second', true);
    toggleFormElement('.thankyou');
    $('.skipform').hide();
}

function toggleFormElement(target){
    $(target).toggleClass('fade-in');
}

function displayOwnPost(){
    $('.own_post').css({display: 'grid'});
    var firstnote = $("#first-note").val();
    var secondnote = $("#second-note").val();
    $('#first_pic_output').siblings('.back').find('span').html(firstnote);
    $('#second_pic_output').siblings('.back').find('span').html(secondnote);
}

function showEditButton(senderid, dir){
    if(dir){
            var initbtn = '#' + 'start-' + senderid + '-flow';
            $(initbtn).html("+ Edit");
    } else{
            var initbtn = '#' + 'start-' + senderid + '-flow';
            $(initbtn).html("+ Add");
    }

}

function resetForm(target, clear, resetall = false){
    if(resetall){
        //Dump form values
        document.getElementById('intakeform').reset();
    }
    if (clear) {
        var imagefield = '#' + target + '-pic';
        var notefield = '#' + target + '-note';
        var portal = '#' + target + '-portal';
        var lowerportal = '#' + target + '-lower-portal';
        $(imagefield).val("");
        $(notefield).val("");
        $(portal).attr('style', '');
        $(lowerportal).attr('style', '');
        showEditButton(target, false);
    }
    if (showSubmit) {
        showSubmit = false;
    }
    updateSubmitBtnState(showSubmit);
}

function completeForm(senderid) {
    var targetid = '#' + senderid + '-formelement';
    formStepOne(senderid);
    toggleFormElement(targetid);
}

var loadFile = function (event) {
    if (!event.target.files[0]) {
        return;
    }
    if(!shouldShowOwn){
        shouldShowOwn = true;
    }
    if(!showSubmit){
        showSubmit = true;
    }
    updateSubmitBtnState(showSubmit);
    var targetid = event.target.id.split('-')[0];
    var portalid = '#' + event.target.id.split('-')[0] + '-portal';
    var lowerportalid = '#' + event.target.id.split('-')[0] + '-lower-portal';
    var ownpostid = '#' + targetid + '_pic_output';
    showEditButton(event.target.id.split('-')[0], true);
    var imgurl = URL.createObjectURL(event.target.files[0])
    
    $(portalid).css({
        'background-image':'url('+ imgurl +')'
    });
    $(lowerportalid).css({
        'background-image': 'url(' + imgurl + ')'
    });
    $(ownpostid).css({
        'background-image': 'url(' + imgurl + ')'
    });
    formStepTwo(targetid);
};

function updateSubmitBtnState(dir){
    if(dir){
        $('#submitwrapper').show();
    } else{
        $('#submitwrapper').hide();
    }
}

function formStepOne(target){
    var portalid = '#' + target + '-portal';
    var uploadbtnid = '#' + target + '-upload';
    var nextbtn = '#' + target + '-next';
    var okbtn = '#' + target + '-ok';

    var notefield = '#' + target + 'notewrapper';
    $(notefield).hide();
    $(notefield).siblings('h3').show();

    $(portalid).parents('.flip-container.formportal').removeClass('hover');
    $(uploadbtnid).show();
    $(nextbtn).hide();
    $(okbtn).hide();
}

function formStepTwo(target) {
    var portalid = '#' + target + '-portal';
    var uploadbtnid = '#' + target + '-upload';
    var nextbtn = '#' + target + '-next';
    var okbtn = '#' + target + '-ok';

    var notefield = '#' + target + 'notewrapper';
    $(notefield).hide();
    $(notefield).siblings('h3').show();

    $(portalid).parents('.flip-container.formportal').removeClass('hover');
    $(uploadbtnid).hide();
    $(nextbtn).show();
    $(okbtn).hide();
}

function formStepThree(target) {
    var portalid = '#' + target + '-portal';
    var uploadbtnid = '#' + target + '-upload';
    var nextbtn = '#' + target + '-next';
    var okbtn = '#' + target + '-ok';

    var notefield = '#' + target + 'notewrapper';
    $(notefield).show();
    $(notefield).siblings('h3').hide();

    $(portalid).parents('.flip-container.formportal').addClass('hover');
    $(uploadbtnid).hide();
    $(nextbtn).hide();
    $(okbtn).show();
}

function retrievePosts(){
    $("#spinner").css({'display': 'flex'});
    // $('.own_post').hide();
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
        docheight = $(document).height() - 400;
    })
}

