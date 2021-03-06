import React, { Component } from 'react';
import firebase from '../firebase'
import Button from 'react-bootstrap/Button'
import { Route, Link, BrowserRouter as Router } from 'react-router-dom';


class Join extends Component {
    
    constructor(props)
    {
        super(props);

        this.state = {
            userName:'',
            gameCode: '',
            showStart: false,
            showSubmit: true,
            userKey: ''
        }
                
        this.updateUserName = this.updateUserName.bind(this);
        this.updateGameCode = this.updateGameCode.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.updatePlayer = this.updatePlayer.bind(this);
        this.addHands = this.addHands.bind(this);
        this.getRandomInt = this.getRandomInt.bind(this);
        this.checkImage = this.checkImage.bind(this);
        this.checkHand = this.checkHand.bind(this);
    }

    updateGameCode(event) {
        this.setState({gameCode: event.target.value});
    }

    updateUserName(event)
    {
        this.setState({userName: event.target.value})
    }

    getRandomInt(min, max) 
    {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //creating the players voting area and submission area in the game session
    updatePlayer(k, i){
        var numberofRounds = 0;
        var user = this.state.userName;
        firebase.database().ref('game-session/' + k + '/numberRounds').once('value', function(snapshot) {
            numberofRounds = snapshot.val()
            for (var roundNum=0; roundNum<numberofRounds; roundNum++){
                var playerSubmission = {
                    nickname : user,
                    submissionID: 0
                }
                var playerVoted = {
                    nickname : user,
                    ballot: 0
                }
                firebase.database().ref('game-session/' + k + '/round/' + (roundNum+1) + '/submissions/players/' + (i+1)).update({playerSubmission});
                firebase.database().ref('game-session/' + k + '/round/' + (roundNum+1) + '/submissions/voting/' + (i+1)).update(playerVoted)
            }
        });
    }


    //adds the four images to the users hands, the number of rounds looks to be hardcoded to 3
    //but from all the test runs it seems to be working, hmmmmmmmmmmm, keep an eye on this
    addHands(k, i){
        var game = this;
        var user = this.state.userName;
        var numberofRounds = 3;
        firebase.database().ref('game-session/' + k + '/numberRounds').once('value').then(function(snapshot) {
            numberofRounds = snapshot.val()
            for (var round = 1; round <= numberofRounds; round++){   
                var hand = {
                    username: user,
                    tile1: Math.floor(Math.random() * (800 - 1 + 1)) + 1,
                    tile2: Math.floor(Math.random() * (800 - 1 + 1)) + 1,
                    tile3: Math.floor(Math.random() * (800 - 1 + 1)) + 1,
                    tile4: Math.floor(Math.random() * (800 - 1 + 1)) + 1
                }         
                firebase.database().ref('game-session/' + k + '/round/' + round + '/hand/' +(i+1)).update(hand);
                game.checkHand(k, round, i);
            } 
        }); 
    }

    //checks four images in a players hand
    checkHand(k, round, i){
        var game = this;
        firebase.database().ref('game-session/' + k + '/round/'+ round + '/hand/'+(i+1)).once('value').then(function(snapshot){
            game.checkImage(snapshot.val().tile1, 'tile1', k, round, i);
            game.checkImage(snapshot.val().tile2, 'tile2', k, round, i);
            game.checkImage(snapshot.val().tile3, 'tile3', k, round, i);
            game.checkImage(snapshot.val().tile4, 'tile4', k, round, i);
        })
        firebase.database().ref('game-session/'+k+'/round/'+round+'/hand/'+(i+1)).once('value').then(function(snapshot){console.log(snapshot.val())});
    }

    //checks images for 404 error
    checkImage(index, tile, k, round, i){
        var game = this;
        firebase.database().ref('images/'+index).once('value').then(function(snapshot){
            if(snapshot.exists()){
                var source = snapshot.val().url;
                fetch('https://cors-anywhere.herokuapp.com/'+source).then((response)=>{
                    if(!response.ok){
                        var ind = game.getRandomInt(1,2020);
                        game.checkImage(ind, tile, k, round, i);
                    }
                    else if(response.ok){
                        var fix;
                        if(tile==='tile1'){
                            fix={'tile1':index};
                        }
                        if(tile==='tile2'){
                            fix={'tile2':index};
                        }
                        if(tile==='tile3'){
                            fix={'tile3':index};
                        }
                        if(tile==='tile4'){
                            fix={'tile4':index};
                        }
                        return firebase.database().ref('game-session/'+k+'/round/'+round+'/hand/'+(i+1)).update(fix)
                    }
                })
        }
            else{
                var ind = game.getRandomInt(1,2020);
                game.checkImage(ind, tile, k, round, i);
            }})
        };


    //occurs when submit button is hit.  Does a lot of stuff, should probably be broken up in the future into many methods.
    //its hard with firebase bc a lot of the calls need to be embedded as the snapshot information cant be stored in variables
    //to be used outside the methods
    /////////
    //adds players user name to an existing game and allows them to get to the lobby of the game.
    handleSubmit()
    {   
        var gc = this.state.gameCode;
        var user = this.state.userName;
        var joined = 0;
        var maxPlayers = 0;
        var current = 0;
        
        firebase.database().ref('game-session/' + gc + '/numberPlayers').once('value', function(snapshot) {
            maxPlayers = snapshot.val()
        });

        if (gc!=null && user!=null && user.toString().length > 3 && user.toString().length < 10){
            firebase.database().ref('game-session/' + gc + '/playersJoined').once('value', function(snapshot) {
                joined = snapshot.val()
                if (joined < maxPlayers) {
                    firebase.database().ref('game-session/' + gc + '/players').child(joined+1).update({
                        nickname : user,
                        powerups : 0,
                        score : 0
                        }).then((snap) => {
                            joined++;
                            this.setState({userKey: joined});
                            var playersJoined = joined;
                            firebase.database().ref('game-session/' + gc).update({playersJoined});
                      });
                }
                else {
                    alert("You cannot join this game")
                } 
            }.bind(this));
            
            firebase.database().ref('game-session/' + gc + '/players').once('value', function(snapshot) {
            }).then((snapshot)=>{
                current = snapshot.numChildren();
                if (current > joined){
                    this.updatePlayer(gc, joined);
                    this.addHands(gc, joined);
                    this.setState({showStart: true});  
                    this.setState({showSubmit:false});
                }
            }); 
        } 
        if (user.toString().length <= 3) {
            alert("Nickname too short");
        }
        if (user.toString().length >= 10) {
            alert("Nickname too long");
        }
    }

    render() { 
        var lobbyLink = "/lobby/" + this.state.userKey + "/" + this.state.gameCode ;
        return   (
            <div>
                <header class='icon'> 
                    <div>
                        <Link to="/"> 
                            <i class="fas fa-home"></i>
                        </Link>   
                    </div>
                </header>
                <header>
                    Join A Game
                </header>
                <div id="gameOptions">
                    <form>
                        <p>Enter Your Nickname </p>
                            <input type="text" onChange={this.updateUserName}></input>
                        <p>Enter Game Code<br></br>
                            <input type="text" name="gameCode" onChange={this.updateGameCode}></input>
                        </p>
                        {this.state.showSubmit ?
                            <Button onClick={this.handleSubmit}>Submit</Button>:null
                        }
                    </form>
                    <div >
                    {this.state.showStart ?
                        <Link to={lobbyLink}><Button >Go To Lobby</Button></Link>:null
                    }
                    </div>
                </div>
        </div>
        );
    }
}
export default Join;