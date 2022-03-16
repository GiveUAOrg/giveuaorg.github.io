from pathlib import Path
import os
from jinja2 import Template
import random

rootdir = Path('../assets/img/portfolio/')
htmldir = Path('../')

# Return a list of regular files only, not directories
file_list = [f for f in rootdir.glob('**/*') if f.is_file()]

items = []
for f in file_list:
    urlPath = Path(os.path.relpath(f, htmldir))
    items.append(
        {
            "url": urlPath.as_posix(),
            "filter": os.path.basename(urlPath.parent)
        }
    )
random.shuffle(items)

html_template = '''
{% for item in items %}
    <div class="col-lg-3 col-md-4 col-sm-6 portfolio-item filter-{{item.filter}}">
        <img src="{{item.url}}" class="img-fluid" alt="">
        <a href="{{item.url}}" data-gallery="portfolioGallery" class="portfolio-lightbox preview-link" title="Donate and help Ukraine">
            <div class="portfolio-info">
                <h4>Give to Ukraine</h4>
                <p>Get an NFT</p>
            </div>
        </a>
    </div>
{% endfor %}
'''

t = Template(html_template)
print(t.render(items=items))