from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_product_ingredients'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='can_use_tpv',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='can_use_accounting',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='can_use_menu',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='can_use_inventory',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='can_use_promos',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='can_use_gallery',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='can_use_settings',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='is_admin_manager',
            field=models.BooleanField(default=False),
        ),
    ]
