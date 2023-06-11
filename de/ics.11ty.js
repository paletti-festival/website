const ics = require("ics");

module.exports = class {
    data() {
        return {
            permalink: "de/calendar.ics",
            addToSitempap: false,
            layout: false
        }
    }

    toDateTimeArray(date) {
        return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
    }

    toDescription({name, start, end, description}) {
        let desc = name + "\n";

        if (start && end) {
            desc += this.formatTime(start) + " – " + this.formatTime(end) + "\n";
        } else if (start) {
            desc += this.formatTime(start) + "\n";
        }

        if (description) {
            desc += "\n" +  description;
        }

        return desc;
    }

    render({collections}) {
        const events = [];

        for (const { data } of collections.dates) {
            const { title, date, until, place, program, status } = data;

            const event = {
                title,
                start: this.toDateTimeArray(date),
                end: this.toDateTimeArray(until),
                startOutputType: "local",
                calName: "Paletti Kleinfestival"
            }

            if (place) {
                event.location = place.name +  ", " +  place.address
            }

            if (program) {
                let description = "";

                if (program.workshops) {
                    description += "Workshops\n"
                    description += "－\n\n"
                    for (const workshop of program.workshops) {
                        description += this.toDescription(workshop) +  "\n\n\n"
                    }
                }

                if (program.presentations) {
                    description += "Präsentationen\n"
                    description += "－\n\n"
                    for (const presentation of program.presentations) {
                        description += this.toDescription(presentation) +  "\n\n\n"
                    }
                }

                if (program.music) {
                    description += "Musik\n"
                    description += "－\n\n"
                    for (const msc of program.music) {
                        description += this.toDescription(msc) +  "\n\n\n"
                    }
                }

                if (description !== "") {
                    event.description = description;
                }
            }

            if (status)
                event.status = status

            events.push(event);
        }

        const { error, value } = ics.createEvents(events);

        if (error) {
            console.log(error)
            return
        }

        return value;
    }
}