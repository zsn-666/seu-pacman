document.addEventListener("DOMContentLoaded", () => {
    const scoreDisplay = document.getElementById("score")
    const width = 28
    let score = 0
    const grid = document.querySelector(".grid")

    // Simplified Sipailou core campus: buildings are obstacles, roads form loops.
    const layout = [
        "############################",
        "############################",
        "##o.......................##",
        "##.#####.##########.#GGGG.##",
        "##.#####.##########.#GGGG.##",
        "##.#####.##########.##G##.##",
        "##.#####.##########.##.##.##",
        "##.#####.##########.##.##.##",
        "##.#####.................o##",
        "##.#####.##.....###.#####.##",
        "##.#####.##.###.###.#####.##",
        "##.#####....###...........##",
        "##.#####.##.###.###.#####.##",
        "##.#####.##.....###.#####.##",
        "##........................##",
        "##.#####.####.#####.#####.##",
        "##.#####.####.#####.#####.##",
        "##.......####.#####.#####.##",
        "##.#####.####.#####.#####.##",
        "##.#####.####.#####.#####.##",
        "##o.......................##",
        "##.#####.####.#####.#####.##",
        "##.#####.####.#####.#####.##",
        "##.#####.####.#####.#####.##",
        "##.#####.####.#####.#####.##",
        "##........... ...........o##",
        "############################",
        "############################"
    ].flatMap(row => [...row].map(cell => ({ ".": 0, "#": 1, "G": 2, "o": 3, " ": 4 })[cell]))
    let remainingDots = layout.filter(cell => cell === 0 || cell === 3).length
    let gameEnded = false

    // 0 - pac-dots
    // 1 - wall
    // 2 - ghost-lair
    // 3 - power-pellet
    // 4 - empty

    const squares = []

    //create your board
    function createBoard() {
        for (let i = 0; i < layout.length; i++) {
            const square = document.createElement("div")
            square.id = i
            grid.appendChild(square)
            squares.push(square)

            //add layout to the board
            if (layout[i] === 0) {
                squares[i].classList.add("pac-dot")
            }
            if (layout[i] === 1) {
                squares[i].classList.add("wall")
            }
            if (layout[i] === 2) {
                squares[i].classList.add("ghost-lair")
            }
            if (layout[i] === 3) {
                squares[i].classList.add("power-pellet")
            }
        }
    }
    createBoard()

    // Keep the square collision area while blending its corners into the road.
    for (let y = 10; y <= 12; y++) {
        for (let x = 12; x <= 14; x++) {
            squares[y * width + x].classList.add("fountain-base")
        }
    }

    // The fountain occupies the central courtyard south of the auditorium.
    const fountain = document.createElement("span")
    fountain.className = "campus-fountain"
    fountain.setAttribute("role", "img")
    fountain.setAttribute("aria-label", "大礼堂前喷泉")
    grid.appendChild(fountain)

    // Place names sit inside building blocks, away from playable roads.
    const landmarks = [
        [13.5,5.5,"大礼堂"],
        [5.5,8,"操场"],
        [22.5,12.5,"健雄院"],
        [11,17.5,"孟芳图书馆"],
        [5.5,23,"梅庵"],
        [22.5,23,"东南院"],
        [13.5,27,"南门"]
    ]
    landmarks.forEach(([x, y, name]) => {
        const label = document.createElement("span")
        label.className = "campus-label"
        label.textContent = name
        label.style.left = x * 20 + "px"
        label.style.top = y * 20 + "px"
        grid.appendChild(label)
    })

    //create Characters
    // draw pac-man onto the board
    let pacmanCurrentIndex = 713
    squares[pacmanCurrentIndex].classList.add("pac-man")

    //move pacman
    function movePacman(e) {
        if (gameEnded) return
        squares[pacmanCurrentIndex].classList.remove("pac-man")
        // switch (e.keyCode) { deprecated
        switch (e.key) {
            // case 37:
            case "ArrowLeft":
                if (
                    pacmanCurrentIndex % width !== 0 &&
                    !squares[pacmanCurrentIndex - 1].classList.contains("wall") &&
                    !squares[pacmanCurrentIndex - 1].classList.contains("ghost-lair")
                ) {
                    pacmanCurrentIndex -= 1
                }

                break
            case "ArrowUp":
                // case 38:
                if (
                    pacmanCurrentIndex - width >= 0 &&
                    !squares[pacmanCurrentIndex - width].classList.contains("wall") &&
                    !squares[pacmanCurrentIndex - width].classList.contains("ghost-lair")

                ) {
                    pacmanCurrentIndex -= width
                }
                break
            case "ArrowRight":
                // case 39:
                if (
                    pacmanCurrentIndex % width < width - 1 &&
                    !squares[pacmanCurrentIndex + 1].classList.contains("wall") &&
                    !squares[pacmanCurrentIndex + 1].classList.contains("ghost-lair")
                ) {
                    pacmanCurrentIndex += 1
                }

                break
            case "ArrowDown":
                // case 40:
                if (
                    pacmanCurrentIndex + width < width * width &&
                    !squares[pacmanCurrentIndex + width].classList.contains("wall") &&
                    !squares[pacmanCurrentIndex + width].classList.contains("ghost-lair")
                ) {
                    pacmanCurrentIndex += width
                }
                break
        }
        squares[pacmanCurrentIndex].classList.add("pac-man")
        pacDotEaten()
        powerPelletEaten()
        checkForGameOver()
        checkForWin()    }

    let activeDirection = null
    let movementTimer = null

    function stopMovement() {
        clearInterval(movementTimer)
        movementTimer = null
        activeDirection = null
    }

    function startMovement(e) {
        if (!["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key)) return
        e.preventDefault()
        if (e.repeat || activeDirection === e.key) return
        stopMovement()
        activeDirection = e.key
        movementTimer = setInterval(() => movePacman({ key: activeDirection }), 250)
        movePacman(e)
    }

    function releaseMovement(e) {
        if (e.key === activeDirection) {
            e.preventDefault()
            stopMovement()
        }
    }

    document.addEventListener("keydown", startMovement)
    document.addEventListener("keyup", releaseMovement)
    window.addEventListener("blur", stopMovement)

    //what happens when you eat a pac-dot
    function pacDotEaten() {
        if (squares[pacmanCurrentIndex].classList.contains("pac-dot")) {
            remainingDots--
            score++
            scoreDisplay.innerHTML = score
            squares[pacmanCurrentIndex].classList.remove("pac-dot")
        }
    }

    //what happens when you eat a power-pellet
    function powerPelletEaten() {
        if (squares[pacmanCurrentIndex].classList.contains("power-pellet")) {
            remainingDots--
            score += 10
            scoreDisplay.innerHTML = score
            ghosts.forEach(ghost => ghost.isScared = true)
            setTimeout(unScareGhosts, 10000)
            squares[pacmanCurrentIndex].classList.remove("power-pellet")
        }
    }

    //make the ghosts stop flashing
    function unScareGhosts() {
        ghosts.forEach(ghost => ghost.isScared = false)
    }

    //create ghosts using Constructor
    class Ghost {
        constructor(className, startIndex, speed) {
            this.className = className
            this.startIndex = startIndex
            this.speed = speed
            this.currentIndex = startIndex
            this.isScared = false
            this.timerId = NaN

        }
    }

    //all my ghosts
    const ghosts = [
        new Ghost("blinky", 133, 250),
        new Ghost("pinky", 134, 400),
        new Ghost("inky", 135, 300),
        new Ghost("clyde", 136, 500),
    ]


    //draw my ghosts onto the grid
    ghosts.forEach(ghost =>
        squares[ghost.currentIndex].classList.add(ghost.className, "ghost"))

    //move ghosts randomly
    ghosts.forEach(ghost => moveGhost(ghost))

    function moveGhost(ghost) {
        const directions = [-1, 1, width, -width]
        let direction = directions[Math.floor(Math.random() * directions.length)]

        ghost.timerId = setInterval(function () {
            //if next square your ghost is going to go to does not have a ghost and does not have a wall
            if (
                !squares[ghost.currentIndex + direction].classList.contains("ghost") &&
                !squares[ghost.currentIndex + direction].classList.contains("wall")
            ) {
                squares[ghost.currentIndex].classList.remove(ghost.className, "ghost", "scared-ghost")
                ghost.currentIndex += direction
                squares[ghost.currentIndex].classList.add(ghost.className, "ghost")
                // else find a new random direction to go in
            } else direction = directions[Math.floor(Math.random() * directions.length)]
            // if the ghost is currently scared
            if (ghost.isScared) {
                squares[ghost.currentIndex].classList.add("scared-ghost")
            }

            //if the ghost is currently scared and pacman is on it
            if (ghost.isScared && squares[ghost.currentIndex].classList.contains("pac-man")) {
                ghost.isScared = false
                squares[ghost.currentIndex].classList.remove(ghost.className, "ghost", "scared-ghost")
                ghost.currentIndex = ghost.startIndex
                score += 100
                scoreDisplay.innerHTML = score
                squares[ghost.currentIndex].classList.add(ghost.className, "ghost")
            }            checkForGameOver()
        }, ghost.speed)
    }

    //check for a game over
    function checkForGameOver() {
        if (gameEnded) return
        if (
            squares[pacmanCurrentIndex].classList.contains("ghost") &&
            !squares[pacmanCurrentIndex].classList.contains("scared-ghost")) {
            gameEnded = true
            ghosts.forEach(ghost => clearInterval(ghost.timerId))
            stopMovement()
            document.removeEventListener("keydown", startMovement)
            setTimeout(function () {
                alert("Game Over")
            }, 500)
        }
    }

    // Win only when every ordinary dot and power pellet has been eaten.
    function checkForWin() {
        if (!gameEnded && remainingDots === 0) {
            gameEnded = true
            ghosts.forEach(ghost => clearInterval(ghost.timerId))
            stopMovement()
            document.removeEventListener("keydown", startMovement)
            setTimeout(function () {
                alert("You have WON!")
            }, 500)
        }
    }
})
