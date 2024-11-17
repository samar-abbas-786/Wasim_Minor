document.getElementById('appointmentForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const patientName = document.getElementById('patientName').value;
    const doctor = document.getElementById('doctor').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Here, you can make an API call to save the appointment
    // For this example, we'll just display a success message
    document.getElementById('successMessage').classList.remove('hidden');

    // Optionally, reset the form
    this.reset();
});
