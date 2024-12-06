import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import '../Dashboard.css';
import MaintenanceScheduler from './MaintenanceScheduler';

const Calendar = () => {
    return (
        <>
            <Header>
            </Header>
            <div className="dashboard">
                <Sidebar />
                <div className="dashboard-content">
                    <MaintenanceScheduler />
                </div>
            </div>
        </>
    );
};

export default Calendar;
