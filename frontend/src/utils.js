// In the file where formatTimeToAMPM is defined, e.g., `utils.js`
export const formatTimeToAMPM = (time) => {
    if (!time) return "";  // Return empty string or set a default value if no time is provided

    const [hours, minutes] = time.split(":");

    let period = 'AM';
    let formattedHours = parseInt(hours, 10);

    if (formattedHours >= 12) {
        period = 'PM';
        if (formattedHours > 12) {
            formattedHours -= 12;  // Convert hours to 12-hour format
        }
    } else if (formattedHours === 0) {
        formattedHours = 12;  // Midnight case
    }

    return `${formattedHours}:${minutes} ${period}`;  // Return time in AM/PM format
};
