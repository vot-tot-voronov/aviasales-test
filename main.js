document.addEventListener('DOMContentLoaded', () => {
    let tickets = [];
    let stop = false;
    async function getId() {
        try{
            const response = await fetch('https://front-test.beta.aviasales.ru/search');
            if (!response.ok) {
                const message = `An error has occured: ${response.status}`;
                throw new Error(message);
            }
            const json = await response.json();
            const result = await json.searchId;
            return result;
        }
        catch(e) {
            console.log(e.message);
        }
    }
    async function getAllTickets() {
        const searchId = await getId();
        async function getOnePackTickets() {
            try {
                if (stop === false) {
                    let response = await fetch(`https://front-test.beta.aviasales.ru/tickets?searchId=${searchId}`);
                    if (!response.ok) {
                        const message = `An error has occured: ${response.status}`;
                        throw new Error(message);
                    }
                    const data = await response.json();
                    tickets = tickets.concat(data.tickets);
                    if (data.stop) {
                        stop = true;
                    }
                    await getOnePackTickets();
                }
            } catch(error) {
                console.log(error.message);
                await getOnePackTickets();
            }
        }
        await getOnePackTickets();
    }
    async function makeCards() {
        await getAllTickets();
        function checkboxSort(name) {
            switch (name) {
                case 'all':
                    if (tabs[0].classList.contains('active')) {
                        renderTickets(cheapestTickets);
                    } else {
                        renderTickets(fastestTickets);
                    }
                    break;
                case 'without':
                    currentCheckbox(0);
                    break;
                case 'one':
                    currentCheckbox(1);
                    break;
                case 'two':
                    currentCheckbox(2);
                    break;
                case 'three':
                    currentCheckbox(3);
                    break;
                default:
                    break;
            }
            function currentCheckbox(numb) {
                if (tabs[0].classList.contains('active')) {
                    let arr = cheapestTickets.filter(item => {
                        if (item.segments[0].stops.length === numb && item.segments[1].stops.length === numb) {
                            return item;
                        }
                    });
                    renderTickets(arr);
                } else {
                    let arr = fastestTickets.filter(item => {
                        if (item.segments[0].stops.length === numb && item.segments[1].stops.length === numb) {
                            return item;
                        }
                    });
                    renderTickets(arr);
                }
            }
            
        }
        function renderTickets(arr) {
            document.querySelectorAll('.ticket').forEach(item => {
                item.remove();
            });
            for (let i = 0; i < 5; i++) {
                new TicketCard(arr[i].price,
                    arr[i].carrier,
                    arr[i].segments,
                    '.tickets'
                ).render();
            }
        }
        function tabsToggle() {
            if (tabs[0].classList.contains('active')) {
                tabs[0].classList.remove('active');
                tabs[1].classList.add('active');
                let currentCheckbox;
                checkboxes.forEach(item => {
                    if (item.checked) {
                        currentCheckbox = item.name;
                    }
                });
                checkboxSort(currentCheckbox);
            } else {
                tabs[1].classList.remove('active');
                tabs[0].classList.add('active');
                let currentCheckbox;
                checkboxes.forEach(item => {
                    if (item.checked) {
                        currentCheckbox = item.name;
                    }
                });
                checkboxSort(currentCheckbox);
            }
        }
        const tabs = document.querySelectorAll('.tabs_block'),
                     checkboxes = document.querySelectorAll('.inputList');
        let cheapestTickets = tickets.slice().sort((prev, next) => {
            return prev.price - next.price;
        });
        let fastestTickets = tickets.slice().sort((prev, next) => {
            return prev.segments[0].duration - next.segments[0].duration;
        });
        tabs.forEach(item => {
            item.addEventListener('click', e => {
                if (!e.currentTarget.classList.contains('active')) {//проверяем не активен ли tab, на который мы кликаем
                    tabsToggle();
                }
            });
        });
        checkboxes.forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.checked) {
                    checkboxes.forEach(item => {
                        item.checked = false;
                    });
                    e.target.checked = true;
                    checkboxSort(e.target.name);
                } else {
                    e.target.checked = true;
                }
            });
        });
        console.log('All tickets: ', tickets);
        renderTickets(cheapestTickets);
    }
    class TicketCard {
        constructor(price, carrier, segments, parent) {
            this.price = price;
            this.carrier = carrier;

            this.originTo = segments[0].origin;
            this.destinationTo = segments[0].destination;
            this.stopsTo = segments[0].stops.length;
            this.stopsToWhere = segments[0].stops.join(',');
            this.durationTo = segments[0].duration;
            this.durationMinTo = segments[0].duration;

            this.originFrom = segments[1].origin;
            this.destinationFrom = segments[1].destination;
            this.stopsFrom = segments[1].stops.length;
            this.stopsFromWhere = segments[1].stops.join(',');
            this.durationFrom = segments[1].duration;
            this.durationMinFrom = segments[1].duration;

            this.dateTo = segments[0].date;
            this.dateFrom = segments[1].date;
            this.dateToDes = segments[0].date; // время 
            this.dateFromDes = segments[1].date; // прибытия

            this.parent = document.querySelector(parent);
            
            this.changePrice();
            this.stopsToNumber(); // высчитываем количество остановок
            this.stopsFromNumber(); //для правильного вывода

            this.durationTimeTo(); // высчитаваем продолжительность
            this.durationTimeFrom(); // полета в часах

            this.getDateTo(); //устанавливаем время 
            this.getDateFrom(); // отбытия и прибытия туда
            this.setDateToDes(); // и обратно 
            this.setDateFromDes();
        }
        changePrice() {
            this.price = this.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        }
        stopsToNumber() {
            if (this.stopsTo === 0) {
                this.stopsTo = `${this.stopsTo} пересадок`;
            } else if (this.stopsTo === 1) {
                this.stopsTo = `${this.stopsTo} пересадка`;
            } else {
                this.stopsTo = `${this.stopsTo} пересадки`;
            }
        }
        stopsFromNumber() {
            if (this.stopsFrom === 0) {
                this.stopsFrom = `${this.stopsFrom} пересадок`;
            } else if(this.stopsFrom === 1) {
                this.stopsFrom = `${this.stopsFrom} пересадка`;
            } else {
                this.stopsFrom = `${this.stopsFrom} пересадки`;
            }
        }
        durationTimeTo() {
            let hours = Math.trunc(this.durationTo/60);
            let minutes = this.durationTo % 60;
            this.durationTo = `${hours}ч ${minutes}м`;
        }
        durationTimeFrom() {
            let hours = Math.trunc(this.durationFrom/60);
            let minutes = this.durationFrom % 60;
            this.durationFrom = `${hours}ч ${minutes}м`;
        }
        getDateTo() {
            let hours = new Date(this.dateTo).getHours(),
                minutes = new Date(this.dateTo).getMinutes();
            if (hours < 10) {
                hours = `0${hours.toString()}`;
            }
            if (minutes < 10) {
                minutes = `0${minutes.toString()}`;
            }
            this.dateTo = `${hours}:${minutes}`;
        }
        getDateFrom() {
            let hours = new Date(this.dateFrom).getHours(),
                minutes = new Date(this.dateFrom).getMinutes();
            if (hours < 10) {
                hours = `0${hours.toString()}`;
            }
            if (minutes < 10) {
                minutes = `0${minutes.toString()}`;
            }
            this.dateFrom = `${hours}:${minutes}`;
        }
        setDateToDes() {
            this.dateToDes = new Date(this.dateToDes).setMinutes(
                    new Date(this.dateToDes).getMinutes() + this.durationMinTo
                );
            let hours = new Date(this.dateToDes).getHours(),
            minutes = new Date(this.dateToDes).getMinutes();
            if (hours < 10) {
                hours = `0${hours.toString()}`;
            }
            if (minutes < 10) {
                minutes = `0${minutes.toString()}`;
            }
            this.dateToDes = `${hours}:${minutes}`;
        }
        setDateFromDes() {
            this.dateFromDes = new Date(this.dateFromDes).setMinutes(
                    new Date(this.dateFromDes).getMinutes() + this.durationMinFrom
                );
            let hours = new Date(this.dateFromDes).getHours(),
            minutes = new Date(this.dateFromDes).getMinutes();
            if (hours < 10) {
                hours = `0${hours.toString()}`;
            }
            if (minutes < 10) {
                minutes = `0${minutes.toString()}`;
            }
            this.dateFromDes = `${hours}:${minutes}`;
        }
        render () {
            const ticket = document.createElement('div');
            ticket.classList.add('ticket');
            ticket.innerHTML = `
                <div class="line line_first">
                    <div class="price">
                        <p class="price_text">${this.price} p</p>
                    </div>
                    <div class="company_logo">
                        <img src="https://pics.avs.io/99/36/${this.carrier}.png" alt="Company's logo" class="logo_name">
                    </div>
                </div>
                <div class="line">
                    <div class="cell">
                        <p class="title_style direction_title">
                            ${this.originTo} - ${this.destinationTo}
                        </p>
                        <p class="inf_style timing">
                            ${this.dateTo} - ${this.dateToDes}
                        </p>
                    </div>
                    <div class="scell">
                        <p class="title_style duration_title">В пути</p>
                        <p class="inf_style duration">${this.durationTo}</p>
                    </div>
                    <div class="cell">
                        <p class="title_style transfer_title">${this.stopsTo}</p>
                        <p class="inf_style transfer">${this.stopsToWhere}</p>
                    </div>
                </div>
                <div class="line line_third">
                    <div class="cell">
                        <p class="title_style direction_title">
                            ${this.originFrom} - ${this.destinationFrom}
                        </p>
                        <p class="inf_style timing">
                            ${this.dateFrom} - ${this.dateFromDes}
                        </p>
                    </div>
                    <div class="scell">
                        <p class="title_style duration_title">В пути</p>
                        <p class="inf_style duration">${this.durationFrom}</p>
                    </div>
                    <div class="cell">
                        <p class="title_style transfer_title">${this.stopsFrom}</p>
                        <p class="inf_style transfer">${this.stopsFromWhere}</p>
                    </div>
                </div>
            `;
            this.parent.append(ticket);
        }
    }
    makeCards();
});