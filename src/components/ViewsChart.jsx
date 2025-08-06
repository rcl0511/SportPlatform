import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/ViewsChart.css';


const ViewsChart = ({ data, filter, setFilter }) => {
  return (
    <div className="views-chart-card">
      <div className="view-filter-buttons">
        <button className={filter === '7days' ? 'active' : ''} onClick={() => setFilter('7days')}>최근 7일</button>
        <button className={filter === 'month' ? 'active' : ''} onClick={() => setFilter('month')}>월별</button>
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>전체</button>
      </div>
      <h3>날짜별 기사 조회수</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="views" stroke="#514EF3" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ViewsChart;
