const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan'); // Loger của http request
const bodyparser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
dotenv.config({path:'config.env'}); // Cài đặt cấu hình 

 mongoose.connect(process.env.MONGO_URL,{ // Kết nối database
        useNewurlParser : true,
    useUnifiedTopology : true
}).then(success=>{
    console.log("connect database thành công "+ success.connection.host);
});





const app = express();
const PORT = process.env.PORT || 8080;
//loger for http request 
app.use(morgan('tiny'));
 // Connect mongoDb

// body parse // xử lý dữ liệu post lên server - get post ...vvv
app.use(bodyparser.urlencoded({extended : true}));
app.set('view engine','ejs');
// app.set('views',path.resolve(__dirname,'view/ejs'))


// Xử lý mongodb kết nối và thiết lập schema 


const Schema = mongoose.Schema;


const task = new Schema({
   task : String,
   position : Number,

},{
    collection: 'task'
});


// Schema chưa phải model
const TaskModel = mongoose.model('task',task);






// load asset 
app.use('/css',express.static(path.resolve(__dirname,'assets/css')))
app.use('/img',express.static(path.resolve(__dirname,'assets/img')))
app.use('/js',express.static(path.resolve(__dirname,'assets/js')))



app.get('/',(req,res)=>{
    TaskModel.find({}).then(data=>{
        list = data.sort(function(a,b){
            var tempa = a.position;
            var tempb = b.position;
            if (tempa < tempb) return -1;
            if (tempa > tempb) return 1;
        
        })


        res.render('index',{
            list : data
        });
    }).catch();
    
})

app.get('/add-task',(req,res)=>{
    res.render('add');
})

app.post('/add-task',(req,res)=>{
    // Tên task phải nhập 
// Không nhập kí tự đặc biệt với tên task
    let regex = /^[^#@!$%\^*\(\)><\//;''"":]+$/
   if(req.body.task_name.match(regex) == null || req.body.task_name.trim().length == 0){
    return res.redirect('back');
   }
    let count = 0;
    TaskModel.count({},function(err,dem){
       count = dem;
       if(count == 0){
        // console.log("Vị trí 00:"+count);
 TaskModel.create({task: req.body.task_name, position : 1}).then(data=>{
        res.redirect('/');
    }).catch()
    }
    else{
        // Tìm position cao nhất 
        TaskModel.find({}).then(data=>{
            // Tìm ra position cao nhất
            let temp = 0;
           
           for(let i = 0 ; i<data.length ; i++){
            if(data[i].position > temp){
                temp = data[i].position;
            }
           }
           count = temp+1;
           TaskModel.create({task: req.body.task_name, position : count}).then(data=>{
               res.redirect('/');
           }).catch()

        }).catch()

       
    }
       
    })
   
})



app.get('/edit-task/:id',(req,res)=>{
   id = req.params.id;

   TaskModel.findById(id).then(data=>{

    res.render('edit',{
        value : data
    });

    }).catch(err=>{
        console.log(err);
    });
   
})

app.post('/edit-task/:id',(req,res)=>{
    // Tên task phải nhập 
// Không nhập kí tự đặc biệt với tên task
// Position phải lớn hơn 0

   let id = req.params.id;
    let position = req.body.task_position;
    let name = req.body.task_name;


    let regex = /^[^#@!$%\^*\(\)><\//;''"":]+$/
    if(name.match(regex) == null || name.trim().length == 0 || parseInt(position)<=0 ){
     return res.redirect('back');
    }
    
    TaskModel.findOne({"position" : parseInt(position)}).then(data=>{
        if(!data){
            TaskModel.findByIdAndUpdate({_id:id},{"task": name , "position" : parseInt(position) }).then(data=>{
                  res.redirect('/');
           
                }).catch(err=>{
                    console.log(err);
                });      
        }
        else{
            TaskModel.findByIdAndUpdate({_id:id},{"task": name , "position" : parseInt(position) }).then(item=>{
              
                TaskModel.findByIdAndUpdate({_id:data._id},{'position': parseInt(item.position)}).then((value)=>{
                        res.redirect('/');
                }).catch(err=>{

                })                
                
           
                }).catch(err=>{
                    console.log(err);
                });
        }
    }).catch(err=>{

    })
   
    
 })


app.get('/delete-task/:id',(req,res)=>{
    id = req.params.id;
    TaskModel.findByIdAndDelete(id).then(data=>{
     res.redirect('/');
     }).catch(err=>{
         console.log(err);
     });
    
 })




app.listen(PORT,()=>{
    console.log("Server is running ");
})