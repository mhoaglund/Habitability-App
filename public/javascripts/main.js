
var token = undefined;
var myrowkey = undefined;
var reachedEnd = false;
var debouncing = false;
var shouldShowOwn = false;
var hasSubmitted = false;
var docheight = 0;
var showSubmit = false;
var mypostable = undefined;

// TODO: hook up a link to hit the post generation endpoint
$(document).ready(function () {
    $('.own_post').hide();
    $(document).on("click", "#retrieve", function () {
        retrievePosts();
    });

    docheight = $(document).height() - 400;
    $(window).on('resize', function () {
        docheight = $(document).height() - 400;
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
        if ($(this).attr('id').split('-')[1] === 'about'){
            $('#about').hide();
        }
        if ($(this).attr('id').split('-')[0] === 'start') {
            formStepOne(senderid);
        }
    });

    $(document).on("click", '.next', function () {
        var senderid = $(this).attr('id').split('-')[0];
        formStepThree(senderid);
    });

    //Catch device key submission
    $(document).keypress(function (e) {
        if (e.keyCode == 13) {
            var senderid = document.activeElement.id.split('-')[0];
            document.activeElement.blur();
            $("input").blur();
            completeForm(senderid);
            return false;
        }
    });

    $(document).on("click", '#skip', function () {
        $([document.documentElement, document.body]).animate({
            scrollTop: $("#see").offset().top
        }, 1000);
    });

    $(document).on("click", '#contact-link', function () {
        $('#about').animate({
            scrollTop: ($("#scrollpoint").position().top)
        }, 800);
    });

    $(document).on("click", '#burg', function () {
        $('#about').css({'display':'block'});
    });

    $(document).on("click", '.ok', function () {
        var senderid = $(this).attr('id').split('-')[0];
        completeForm(senderid);
    });

    $(document).on('scroll', function () {
        if ($(window).scrollTop() + $(window).height() >= docheight) {
            if(!debouncing){
                if (!reachedEnd) {
                    retrievePosts();
                }
            }
        }
    })


    $('#contactform').submit(function (e) {
        e.preventDefault();
        var form = $(this);
        $('#submitcontact').prop("disabled", true);
        $.ajax({
            type: "POST",
            url: "/contact",
            data: form.serialize(), // serializes the form's elements.
            success: function(data){
                toggleFormElement('#sentalert');
                setTimeout(function () {
                    $('#about').hide();
                    $('#sentalert').removeClass('fade-in');
                    $('#submitcontact').prop("disabled", false);
                }, 2000);

            },
            error: function (e) {
                $('#about').hide();
                console.log(e);
            }
        })
    });

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

                        $('#shareable').show();
                        $('#skip').hide();

                        $([document.documentElement, document.body]).animate({
                            scrollTop: $("#intake").offset().top
                        }, 1000);

                        setTimeout(function () {
                            $.ajax({
                                type: "GET",
                                url: "/generate?RowKey=" + myrowkey,
                                timeout: 90000,
                                success: function (reply) {
                                    console.log(reply);
                                    mypostable = "https://habdata.blob.core.windows.net/habdatablob/" + reply.file;
                                    var mypostimg = "<img src='" + "https://habdata.blob.core.windows.net/habdatablob/" + reply.file + "'/>"
                                    $('#shareable').append(mypostimg);
                                    $('#awaitshareable').hide();
                                    $('#shareable h3').hide();
                                    $('#shareable .floatingshare').show();
                                    $('#share').attr('href', mypostable);
                                },
                                error: function (e) {
                                    console.log(e);
                                    //TODO show post error state
                                }
                            })
                        }, 5000);
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
    $('#intakeform input, #intakeform a').hide();
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
    var firstnote = $("#first-note").val().trim();
    var secondnote = $("#second-note").val().trim();

    if(firstnote){
        $('#first_pic_output').siblings('.back').find('span').html(firstnote);
        $('#first_note_render').find('mark').html(firstnote);
    }
    if(secondnote){
        $('#second_pic_output').siblings('.back').find('span').html(secondnote);
        $('#second_note_render').find('mark').html(secondnote);
    }   
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
    var renderid = '#' + targetid + '_pic_render';
    showEditButton(event.target.id.split('-')[0], true);
    var imgurl = URL.createObjectURL(event.target.files[0])

    //https://github.com/exif-js/exif-js
    // EXIF.getData(event.target.files[0], function () {
    //     var make = EXIF.getTag(this, "Make");
    //     var model = EXIF.getTag(this, "Model");
    //     alert(`${make} ${model}`);
    // });

    $(portalid).css({
        'background-image':'url('+ imgurl +')'
    });
    $(lowerportalid).css({
        'background-image': 'url(' + imgurl + ')'
    });
    $(ownpostid).css({
        'background-image': 'url(' + imgurl + ')'
    });
    $(renderid).css({
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
    $('#scale-bar').show();
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

