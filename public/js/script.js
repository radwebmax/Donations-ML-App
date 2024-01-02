// public/js/predict.js
document.addEventListener('DOMContentLoaded', function() {
    const predictionForm = document.getElementById('postCreationform');
    const predictBtn = document.getElementById('predictDate');
    const predictionResult = document.getElementById('prediction-result');
    const predictedDateRow = document.querySelector('.predicted__date-row');
    const predictedDeadlineInput= document.querySelector('input[name="predictedDeadline"]');

    predictBtn.addEventListener('click', function(e) {
        //e.preventDefault(); // Prevent the default form submission
   
        // Serialize the form data to send via POST request
        const formData = new FormData(predictionForm);
        formData.append("month", new Date().getMonth());
        formData.delete("name");
        formData.delete("description");
        formData.delete("userId");
        formData.delete("predictedDeadline");
        formData.delete("monobankUrl");
        formData.delete("privatUrl");
        formData.get('coverage')

        // Create an XMLHttpRequest object
        const xhr = new XMLHttpRequest();

        // Define the POST request
        xhr.open('POST', '/predict', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        // Handle the response
        xhr.onload = function() {
            if (xhr.status === 200) {
                let date = new Date();
                date.setDate(date.getDate() + parseInt(xhr.responseText));
                let predicetedDate = formatDateFromString(date);
               
                predictionResult.textContent = `Прогнозована дата закриття за заданими параметрами: ${predicetedDate}`;
                //predictedDateRow.classList.remove('hidden');
                predictedDeadlineInput.value = predicetedDate;
                console.log(xhr.responseText)
            } else {
                console.error('Error:', xhr.statusText);
            }
        };

        // Send the request
        xhr.send(new URLSearchParams(formData));
    });

    function formatDateFromString(dateString) {
        const dateObj = new Date(dateString);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-11
        const day = String(dateObj.getDate()).padStart(2, '0'); // getDate() returns 1-31
    
        return `${year}-${month}-${day}`;
    }
});
