<!DOCTYPE html>

<html lang="en">
<!-- THEME BOOT: put before CSS to avoid FOUC -->
<script>
(function(){
  try{
    var ls = localStorage.getItem('sb_theme');
    if(ls){
      var t = JSON.parse(ls);
      var c = t.brand || t.color;
      if(c){
        var r = document.documentElement;
        r.style.setProperty('--sb-accent', c);
        r.style.setProperty('--sb-primary', c);
      }
    }
  }catch(e){}
})();
</script>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>SpicyBeats Deals</title>
<link href="style.css" rel="stylesheet"/>
<link href="cards.css" rel="stylesheet"/>
<link href="theme.css" rel="stylesheet"/>

<body>
  <?php include 'header.html'; ?>

<!-- Global Header Loader -->
<div id="global-header"></div>
<link href="header.css" rel="stylesheet"/>
<script defer="" src="loadHeader.js"></script>
<!-- Search Bar: visible below the global header -->
<div class="search-container" id="search-bar">

  <!-- Location controls (non-intrusive; works with main search) -->
  <div class="loc-row" id="location-controls">
    <input id="location-input" class="city-input" type="text" placeholder="Location (India)" aria-label="Location filter" list="location-options">
    <datalist id="location-options">
      <!-- Top Indian cities for quick preload -->
      <option value="Mumbai"></option><option value="Delhi"></option><option value="Bengaluru"></option><option value="Hyderabad"></option>
      <option value="Ahmedabad"></option><option value="Chennai"></option><option value="Kolkata"></option><option value="Surat"></option>
      <option value="Pune"></option><option value="Jaipur"></option><option value="Lucknow"></option><option value="Kanpur"></option>
      <option value="Nagpur"></option><option value="Indore"></option><option value="Thane"></option><option value="Bhopal"></option>
      <option value="Visakhapatnam"></option><option value="Pimpri-Chinchwad"></option><option value="Patna"></option><option value="Vadodara"></option>
      <option value="Ghaziabad"></option><option value="Ludhiana"></option><option value="Agra"></option><option value="Nashik"></option>
      <option value="Faridabad"></option><option value="Meerut"></option><option value="Rajkot"></option><option value="Kalyan-Dombivli"></option>
      <option value="Vasai-Virar"></option><option value="Varanasi"></option><option value="Srinagar"></option><option value="Aurangabad"></option>
      <option value="Dhanbad"></option><option value="Amritsar"></option><option value="Navi Mumbai"></option><option value="Allahabad"></option>
      <option value="Ranchi"></option><option value="Howrah"></option><option value="Coimbatore"></option><option value="Jabalpur"></option>
      <option value="Gwalior"></option><option value="Vijayawada"></option><option value="Jodhpur"></option><option value="Madurai"></option>
      <option value="Raipur"></option><option value="Kota"></option><option value="Guwahati"></option><option value="Chandigarh"></option>
      <option value="Solapur"></option><option value="Hubballi-Dharwad"></option><option value="Bareilly"></option><option value="Mysuru"></option>
      <option value="Tiruchirappalli"></option><option value="Tiruppur"></option><option value="Dehradun"></option><option value="Thiruvananthapuram"></option>
      <option value="Vijayanagaram"></option><option value="Warangal"></option><option value="Guntur"></option><option value="Bhiwandi"></option>
      <option value="Saharanpur"></option><option value="Gorakhpur"></option><option value="Bikaner"></option><option value="Amravati"></option>
      <option value="Noida"></option><option value="Jamshedpur"></option><option value="Bhilai"></option><option value="Cuttack"></option>
      <option value="Firozabad"></option><option value="Kochi"></option><option value="Bhavnagar"></option><option value="Durgapur"></option>
      <option value="Asansol"></option><option value="Nanded"></option><option value="Ajmer"></option><option value="Jamnagar"></option>
      <option value="Ujjain"></option><option value="Siliguri"></option><option value="Jhansi"></option><option value="Ulhasnagar"></option>
      <option value="Nellore"></option><option value="Jammu"></option><option value="Sangli"></option><option value="Belagavi"></option>
      <option value="Mangaluru"></option><option value="Tirunelveli"></option><option value="Malegaon"></option><option value="Gaya"></option>
      <option value="Udaipur"></option><option value="Rohtak"></option><option value="Hisar"></option><option value="Gandhinagar"></option>
      <option value="Rourkela"></option><option value="Erode"></option><option value="Brahmapur"></option><option value="Moradabad"></option>
      <option value="Aligarh"></option><option value="Salem"></option><option value="Bokaro"></option><option value="Tirupati"></option>
      <option value="Thrissur"></option><option value="Guntur"></option><option value="Karimnagar"></option><option value="Nizamabad"></option>
      <option value="Kollam"></option><option value="Kakinada"></option><option value="Bhagalpur"></option><option value="Muzaffarpur"></option>
    </datalist>
    <button id="btn-apply-location" class="btn btn-apply" type="button" title="Apply location filter">Apply</button>
    <button id="btn-use-location" class="btn btn-geo" type="button" title="Use current location">📍 Near Me</button>
  </div>

<input class="search-input" id="deal-search" placeholder="Search deals..." type="search"/>
</div>
<div id="deals-toolbar" class="deals-toolbar"></div>
<main>
<div class="deal-list" id="deal-list">Loading deals...</div>
<div id="scroll-sentinel" style="height:1px;width:100%"></div>
<div class="pagination-container" id="pagination" style="margin-top:1rem;"></div>
</main>
<script defer="" src="theme.js"></script>
<script src="bagit.js"></script>
<script src="search.js"></script>
<script defer src="deals_filters_v3.js?v=3"></script>
<script src="footer.js"></script>
<!-- Search functionality script -->
<script defer="" src="/bagit/pagination.js"></script></body>
</html>
