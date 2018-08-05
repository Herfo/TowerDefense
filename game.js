// Javascript
// Referência: https://gamedevacademy.org/how-to-make-tower-defense-game-with-phaser-3/



// Configurações do jogo
var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 1216,
    height: 704,
    physics: {
        default: 'arcade'
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

// Criação do jogo
let game = new Phaser.Game(config);

// Declaração das variáveis
let graphics;
let path;
let ENEMY_SPEED = 1/15000;
let BULLET_DAMAGE = 50;
let money = 150;
let score = 0;
let lives = 10;
let gameOver = false;
let moneyDiv = document.getElementById('money');
let scoreDiv = document.getElementById('score');
let livesDiv = document.getElementById('lives');
let pause = document.getElementById('pause');

// Mapa do jogo
let map =      [[ 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0],
                [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, -1, 0, 0, 0, 0, -1, 0],
                [ 0, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, -1, -1, -1, -1],
                [ 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [ 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

// Dar loading assets do jogo
function preload ()
{
    this.load.image('background', '/assets/canvasBackground.png');
    this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');    
    this.load.image('bullet', 'assets/bullet.png');
}


// Criar uma class para os inimigos
let Enemy = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Image,

    initialize:

    function Enemy (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'enemy');
        
        this.follower = { t: 0, vec: new Phaser.Math.Vector2() };

    },
    
    startOnPath: function ()
        {
            // Coloca o parametro t no inicio do "path"
            this.follower.t = 0;
            
            // Guarda o x e y do ponto t        
            path.getPoint(this.follower.t, this.follower.vec);
            
            //  Define as coordenadas x e y do inimigo para as que foram recebidas do passo anterior
            this.setPosition(this.follower.vec.x, this.follower.vec.y);
                        	
            // Definir o HP dos inimigos	
            this.hp = 100;    
            
    },
    
    receiveDamage: function(damage) {
            this.hp -= damage;           
            
            // Se o HP for menor que 0, retiramos o inimigo
            if(this.hp <= 0) {
                this.setActive(false);
                this.setVisible(false);
                money += 10;
                score += 1;
                moneyDiv.innerHTML = `Money: ${money}€ `;
                scoreDiv.innerHTML = `Score: ${score}`;
            }
    },
    
    update: function (time, delta)
    {
        // Mover o ponto t ao longo do "path", 0 é inicio e 0 é o fim
        this.follower.t += ENEMY_SPEED * delta;
            
        // Obtem as novas coordenadas x e y do vec
        path.getPoint(this.follower.t, this.follower.vec);
            
        // Dar update ao x e y do inimigo para as novas coordenadas
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
 
        // Se chegarmos ao fim do "path", remover o inimigo
        if (this.follower.t >= 1)
        {
            this.setActive(false);
            this.setVisible(false);
            lives -= 1;
            livesDiv.innerHTML = `Lives: ${lives}`;
        }
                
        if (lives <= 0){
            gameOver = true;
            console.log('Game Over!');
        }   
    }

});

// Criar uma class para as torres
let Turret = new Phaser.Class({
 
        Extends: Phaser.GameObjects.Image,
 
        initialize:
 
        function Turret (scene)
        {
            Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
            this.nextTic = 0;
        },
        //  Colocar as torres consoante a grid
        place: function(i, j) {            
            this.y = i * 64 + 64/2;
            this.x = j * 64 + 64/2;
            map[i][j] = 1;            
        },
    
        fire: function() {
            var enemy = getEnemy(this.x, this.y, 100);
            if(enemy) {
                var angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
                addBullet(this.x, this.y, angle);
                this.angle = (angle + Math.PI/2) * Phaser.Math.RAD_TO_DEG;
            }
        },
    
        update: function (time, delta)
        {
            // Disparar com a torre
            if(time > this.nextTic) {
                this.fire();
                this.nextTic = time + 1000;
            }
        }
});

// Criar uma class para as balas
var Bullet = new Phaser.Class({
 
    Extends: Phaser.GameObjects.Image,
 
    initialize:
 
    function Bullet (scene)
    {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');
 
        this.dx = 0;
        this.dy = 0;
        this.lifespan = 0;
 
        this.speed = Phaser.Math.GetSpeed(600, 1);
    },
 
    fire: function (x, y, angle)
    {
        this.setActive(true);
        this.setVisible(true);
 
        //  As balas disparam do meio do ecrã para as coordenadas x/y
        this.setPosition(x, y);
 
    //  we don't need to rotate the bullets as they are round
        this.setRotation(angle);
 
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
 
        this.lifespan = 300;
    },
 
    update: function (time, delta)
    {
        this.lifespan -= delta;
 
        this.x += this.dx * (this.speed * delta);
        this.y += this.dy * (this.speed * delta);
 
        if (this.lifespan <= 0)
        {
            this.setActive(false);
            this.setVisible(false);
        }
    }
 
});


function create ()
{
    this.add.image(608.5, 352, 'background');
    // Este elemento gáfico é apenas para visualização,
    // Não está relacionado com o "path"
    var graphics = this.add.graphics();    

    // Caminho para os enimigos
    // Parâmetros são o as coordenadas iniciais do x e do y
    path = this.add.path(160, 704);
    path.lineTo(160, 160);
    path.lineTo(544, 160);
    path.lineTo(544, 544);
    path.lineTo(928, 544);
    path.lineTo(928, 288);
    path.lineTo(1216, 288);
    path.lineTo(1216, 288);
    path.lineTo(1216, 288);
    
//    graphics.lineStyle(3, 0xffffff, 1);
//    // Visualizar o "path"
//    path.draw(graphics);
    
    // Criar grupo dos inimigos
    enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
	this.nextEnemy = 0;
    
    // Chamar a função para criar a grid
    var graphics = this.add.graphics();    
    drawGrid(graphics);
    
    // Criar grupo das torres
    turrets = this.add.group({ classType: Turret, runChildUpdate: true });
    
    // Chamar a função placeTurret; criar uma torre ao clicar 
    this.input.on('pointerdown', placeTurret);
    
    // Criar grupo das balas
    bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    
    // Chamar a função de dar damage aos inimigos
    this.physics.add.overlap(enemies, bullets, damageEnemy);
    
    // Numero de vidas       
    livesDiv.innerHTML = `Lives: ${lives}`;
    
    // Quantidade de dinheiro
    moneyDiv.innerHTML = `Money: ${money}€`;
    
    // Score
    scoreDiv.innerHTML = `Score: ${score}`;    
    var enemy = enemies.get();
    
    // Pausar o jogo
//    pause.inputEnabled = true;
//    pause.events.onInputUp.add(function(){
//        game.paused = game.paused ? false : true;
//        console.log(game.paused)
//    } )
    
    // pause.addEventListener('click',function(){
    //     game.pauseEvent = game.pauseEvent ? false : true;
    //     console.log(game.paused);
    //     console.log(pauseEvent);
        
    // } )
    
//    pause.addEventListener('click',function(){
//        game.physics.arcade.isPaused = (game.physics.arcade.isPaused) ? false : true;
//    })
    
    
    
}

function update (time,delta)
{
    // Se for tempo para o próximo inimigo
    if (time > this.nextEnemy)
    {        
        var enemy = enemies.get();
        if (enemy)
        {
            enemy.setActive(true);
            enemy.setVisible(true);
            
            // Colocar um inimigo no inicio do "path"x
            enemy.startOnPath();
            
            this.nextEnemy = time + 1000;
        }       
    }
    
    if(gameOver){
        return;
    }
    
    
}

// Função para criar uma grid 
function drawGrid(graphics) {
    graphics.lineStyle(1, 0xEAEAEA, 0.5);
    for(var i = 0; i < 11; i++) {
        graphics.moveTo(0, i * 64);
        graphics.lineTo(1216, i * 64);
    }
    for(var j = 0; j < 19; j++) {
        graphics.moveTo(j * 64, 0);
        graphics.lineTo(j * 64, 704);
    }
    graphics.strokePath();
}

//Função para criar torres
function placeTurret(pointer) {
    console.log('torre colocada') ;
    gameOver = true;
    
    var i = Math.floor(pointer.y/64);
    var j = Math.floor(pointer.x/64);
    if(canPlaceTurret(i, j) && money >= 50) {
        var turret = turrets.get();
        money -= 50;
        moneyDiv.innerHTML = `Money: ${money}€`;
        if (turret)
        {
            turret.setActive(true);
            turret.setVisible(true);
            turret.place(i, j);
        }   
    }
}

// Verificar onde colocar a torre
function canPlaceTurret(i, j) {
    return map[i][j] === 0;
}

// Função para disparar balas
function addBullet(x, y, angle) {
    var bullet = bullets.get();
    if (bullet)
    {
        bullet.fire(x, y, angle);
    }
}

// Função distância entre inimigo e torre
function getEnemy(x, y, distance) {
    var enemyUnits = enemies.getChildren();
    for(var i = 0; i < enemyUnits.length; i++) {       
        if(enemyUnits[i].active && Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <= distance)
            return enemyUnits[i];
    }
    return false;
}

// Função para dar damage aos inimigos
function damageEnemy(enemy, bullet) {  
    // Apenas se o inimigo e a bala estiverem vivos
    if (enemy.active === true && bullet.active === true) {
        // Removemos a bala
        bullet.setActive(false);
        bullet.setVisible(false);    
        
        // Diminuimos o Hp do inimigo com a BULLET_DAMAGE
        enemy.receiveDamage(BULLET_DAMAGE);
    }
    
}


