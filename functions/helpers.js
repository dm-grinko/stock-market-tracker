/*
* Helpers are functions that can be used in any project
* They should not contain project-specific logic
*/

exports.getCurrentDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
};

exports.getCurrentTime = () => {
    const today = new Date();
    const hours = today.getHours();
    const minutes = today.getMinutes();
    const seconds = today.getSeconds();
    return `${hours}:${minutes}:${seconds}`
}

exports.getAlexaResponse = text => ({
    version: "1.0",
    response: {
        outputSpeech: {
            type: "PlainText",
            text, 
        },
        shouldEndSession: true
    },
    sessionAttributes: {}
})

exports.roundAbs = number => Math.round(Math.abs(number) * 10) / 10;

exports.isEmpty = obj => Object.keys(obj).length === 0 && obj.constructor === Object;