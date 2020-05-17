'use strict';

const Hapi = require('@hapi/hapi');
const fetch = require("node-fetch");



const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            const host = request.info.host;
            return 'Hello Pomelo!<br> 1. Challenge Part 1: Please send a POST request to localhost port 3000 path /part-1 together with the JSON input stated in the requirements  <br>2. Challenge Part 2: <a href="//'+host+'/part-2"> Here </a>';
        }
    });


    //Challenge 1
    server.route({
        method: 'POST',
        path: '/part-1',
        handler: function (request, h) {

            //get post params
            const data = request.payload;

            //calling recursive function to rebuild the family tree
            var family_tree  = rebuild_data(data);

            //response new family three
            return family_tree;


            function rebuild_data(data, parent=null){
                var branch = [];
                var i,x;
                for (i = 0; i < Object.keys(data).length; i++) {

                    for (x in data[i]) {
                        //compare if all child parent ID with the parent ID in the param
                        if(data[i][x].parent_id==parent){
                            var child = rebuild_data(data,data[i][x].id);

                            //if the child response not empty, then add the child under the current parent
                            if(child.length){
                                data[i][x].children = child;
                            }
                            branch.push(data[i][x]);
                        }
                    }
                }
                return branch;
            }
        }
    });


    // Challenge 2
    server.route({
        method: 'GET',
        path: '/part-2',
        handler: function (request, h) {

            const params = request.query
            const host = request.info.host;

            //checking page parameter, make sure no error when end user simply change the param value
            var url,page;
            if(params.page===undefined || params.page==1){
                url = "https://api.github.com/search/repositories?q=nodejs&per_page=10&sort=stars&order=desc";
                page = 1;
            }else {
                url = "https://api.github.com/search/repositories?q=nodejs&per_page=10&sort=stars&order=desc&page="+params.page;
                page = parseInt(params.page);
                if(!Number.isInteger(page)){
                    page=1;
                }

                if(page>100){
                    return 'Only the first 1000 search results are available..  Return to <a href="//'+host+'/part-2?page=1">Page 1</a>';
                }
            }


            return fetch(url)
                .then(response => response.json())
                .then(data => {
                    //console.log(data)
                    var x,i;

                    //build table
                    var html = '<table border="1">';
                    html += '<tr><th colspan="4"><h1>Github Repositories For NodeJS</h1></th></tr>';
                    html += '<tr><th>Name</th><th>Description</th><th>Clone URL</th><th> &#9733; Count</th></tr>';

                    //loop over the response and print it out
                    for (i in data) {
                        for (x in data[i]) {
                            html += '<tr>'

                            html += '<td> <a target="_BLANK" href="' + data[i][x].html_url + '"> ' + data[i][x].name + ' </a></td>'
                            html += '<td>' + data[i][x].description + '</td>'
                            html += '<td>' + data[i][x].clone_url + '</td>'
                            html += '<td> &#9734; ' + data[i][x].stargazers_count + '</td>'

                            html += '</tr>'
                        }
                    }

                    //Pagination setting
                    if(page==1){
                        html += '<tr><th colspan="4"> <b>1</b> &nbsp&nbsp <a href="//'+host+'/part-2?page='+ (parseInt(page)+1) +'">Next</a></th></tr>';
                    }else{
                        html += '<tr><th colspan="4"> <a href="//'+host+'/part-2?page='+ (page-1) +'">Prev</a>  &nbsp&nbsp <b> '+page+' </b> &nbsp&nbsp <a href="//'+host+'/part-2?page='+ (parseInt(page)+1) +'">Next</a> </th></tr>';
                    }

                    html += '</table>'
                    return html;
                })
                .catch(err => console.log(err));
        }
    });



    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});



init();

