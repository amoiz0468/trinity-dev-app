from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
