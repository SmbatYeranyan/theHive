var totFSize = 0;
    
    //cross-browser Event Listener Attaching library method.


function processFile(file){
    totFSize += file.size;
    console.log(file);


        var reader = new FileReader();
        reader.onload = function(e) {
           // o.innerHTML = "<p>File: <strong>" + file.name + "</strong>. File size: <strong>" + Math.round(file.size*100/1024)/100 + " kB</strong></p><img src='" + e.target.result + "'/><hr/>" + o.innerHTML;
            //console.log(e.target.result);
          

        }
        reader.readAsDataURL(file);
        processFileUpload(file);

    
    //o.innerHTML += "<p>You added <strong>" + file.name + "</strong> of type <strong>" + file.type + "</strong> having size <strong>" + file.size + "</strong> bytes</p>";
    //t.innerHTML =  Math.round(totFSize*100/1024)/100 ;
}   


function processFileUpload(droppedFiles) {
         // add your files to the regular upload form
    var uploadFormData = new FormData($("#upload")[0]); 

        uploadFormData.append("files",droppedFiles);  // adding every file to the form so you could upload multiple files
        
       $.ajax({
            url : "/upload", // use your target
            type : "POST",
            data : uploadFormData,
            cache : false,
            contentType : false,
            processData : false,
            xhr: function() {
                var req = $.ajaxSettings.xhr();
                if (req) {
                    req.upload.addEventListener('progress', function(event) {
                        if (event.lengthComputable) {
                            var percent = Math.floor((event.loaded / event.total) * 100);

                            //console.log(percent); // = 'test'; //event.loaded + ' / ' + event.total;
                            $(".controls #uploadnew").html("Uploading: "+percent +"%");

                        }
                    }, false);
                }
                return req;
            },
            success : function(data) {

                data= data.replace("true","");
                console.log(data); 


         

            }
       });

 }

